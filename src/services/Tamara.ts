import {
      AbstractPaymentProcessor,
      PaymentProcessorContext,
      PaymentProcessorError,
      PaymentProcessorSessionResponse,
      PaymentSessionStatus,
      Logger,Cart
} from "@medusajs/medusa";
import itemsService from "./items";
import axios, { AxiosResponse } from "axios";
import { humanizeAmount } from "medusa-core-utils"

class MyPaymentProcessor extends AbstractPaymentProcessor {
      private   tamara_token: string;
      private   tamara_api: string;
      private   notification: string;
      private   web_endpoint: string;
      private    cart: Cart;
      private    itemsService: itemsService;
      private    logger : Logger;
      constructor({ itemsService, logger  }, options) {
            super(arguments[0]);
            this.itemsService = itemsService;
            this.logger = logger;
            this.tamara_token = options.tamara_token;
            this.tamara_api = options.tamara_api;
            this.web_endpoint = options.web_endpoint;
            this.notification = options.notification;
      }
      updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
            throw new Error("1");
      }

      static identifier = "Tamara";

      async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
            const cart = this.cart;
            const amount = cart.total
            try {                  
                  const data = {
                        "order_id": paymentSessionData.order_id,
                        "total_amount": {
                              "amount": amount/100,
                              "currency": cart.region.currency_code,
                        },
                        "shipping_info": {
                              "shipped_at": "2019-08-24T14:15:22Z",
                              "shipping_company": cart.shipping_methods[0],
                        }
                  }

                  const headers = {
                        authorization: `Bearer ${this.tamara_token}`,
                  };

                  await axios.post(`${this.tamara_api}/payments/capture`, data, { headers });
                  return await this.retrievePayment(paymentSessionData);
            } catch (error) {
                  this.logger.error(error.message); 

                  return error;
            }
      }
      async authorizePayment(
            paymentSessionData: Record<string, unknown>,
            context: PaymentProcessorContext
      ): Promise<PaymentProcessorError | {
            status:
            PaymentSessionStatus; data: Record<string, unknown>
      }> {
            try {

                  const status = await
                        this.getPaymentStatus(paymentSessionData);
                  const temp = await
                        this.retrievePayment(paymentSessionData);
                  const data = { ...temp };

                  const headers = {
                        authorization: `Bearer ${this.tamara_token}`,
                  };
                  const res = await axios.post(`${this.tamara_api}/orders/${paymentSessionData.order_id}/authorise`, {}, { headers })


                  return {
                        status,
                        data,
                  }
            } catch (error) {
                  const e: PaymentProcessorError = {
                        "error": error
                  }
                  return e;
            }
      }

      async cancelPayment(
            paymentSessionData: Record<string, unknown>
      ): Promise<Record<string, unknown> | PaymentProcessorError> {
            try {                  
                  const data = {
                        "total_amount": {
                              //@ts-ignore
                              "amount": paymentSessionData.paid_amount.amount,
                              //@ts-ignore
                              "currency": paymentSessionData.paid_amount.currency,
                        }
                  }

                  const headers = {
                        authorization: `Bearer ${this.tamara_token}`,
                  };

                  const response = await axios.post(`${this.tamara_api}/orders/${paymentSessionData.order_id}/cancel`, data, { headers });
                  
            } catch (error) {
                  this.logger.error(error.message); 

                  return error;
            }
      }
      async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
            
            const cart = await this.itemsService.getCart(context.resource_id);
            this.cart = cart;
            const currency_code = cart.region.currency_code.toUpperCase();

            const data = {
                  "order_reference_id": context.resource_id,
                  "total_amount": {
                        "amount": humanizeAmount(context.amount, context.currency_code),
                        "currency": context.currency_code.toUpperCase()
                  },
                  "description": `Customer Order n° ${context.resource_id} with total of ${humanizeAmount(context.amount, context.currency_code)}`,
                  "country_code": currency_code.slice(0, 2),
                  "payment_type": "PAY_BY_INSTALMENTS",
                  "instalments": 3, 
                  "items": await this.itemsService.getitems(context),
                  "consumer": {
                        "first_name": cart.shipping_address?.first_name|| "Guest",
                        "last_name": cart.shipping_address?.last_name || "Customer",
                        "phone_number": cart.shipping_address?.phone || "+966500000001",
                        "email": cart.email || "",
                  },
                  "shipping_address": {
                        "first_name": cart.shipping_address?.first_name || "Guest",
                        "last_name": cart.shipping_address?.last_name || "Customer",
                        "line1": cart.shipping_address?.address_1,
                        "city": cart.shipping_address?.city,
                        "country_code": currency_code.slice(0, 2),
                  },

                  "tax_amount": {
                        "amount": cart.tax_total / 100,
                        "currency":currency_code 
                  },
                  "shipping_amount": {
                        "amount": cart.shipping_total / 100,
                        "currency": currency_code
                  },
                  "merchant_url": {
                        "success": `${this.web_endpoint}/checkout`,
                        "failure": `${this.web_endpoint}/failure`,
                        "cancel": `${this.web_endpoint}/cancel`,
                        "notification": this.notification,
                  },
                  "platform": "medusa"

            }

            const config = {
                  headers: {
                        Authorization: `Bearer ${this.tamara_token}`,
                  },
            };
            this.logger.info(`data: ${JSON.stringify(data)}`);
            const url = `${this.tamara_api}/checkout`;
            const response: AxiosResponse = await axios.post(url, data, config);
            const responseData = await response.data;


            return responseData;
      }
      async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
            return paymentSessionData;
      }
      async getPaymentStatus(
            paymentSessionData: Record<string, unknown>
      ): Promise<PaymentSessionStatus> {
            const responceData = await this.retrievePayment(paymentSessionData);
            const status = responceData["status"]

        switch (status) {
            case "authorised":
                return PaymentSessionStatus.AUTHORIZED;
            case "canceled":
                return PaymentSessionStatus.CANCELED;
            case "new":
                return PaymentSessionStatus.PENDING;
            case "new":
                return PaymentSessionStatus.REQUIRES_MORE;
            default:
                return PaymentSessionStatus.ERROR;
        }
      }
      async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown> | PaymentProcessorError> {
            try {
                  const amount = refundAmount / 100
                  const payment_id = paymentSessionData.order_id
                  const data = {

                        "total_amount":

                        {
                              amount: amount,
                              currency: this.cart.region.currency_code
                        },
                        "comment": `Refund for the order ${payment_id}`

                  }

                  const headers = {
                        authorization: `Bearer ${this.tamara_token}`,
                  };


                  await axios.post(`${this.tamara_api}/payments/simplified-refund/${payment_id}`, data, { headers });

                  return await this.retrievePayment(paymentSessionData);
            } catch (error) {
                  return error;
            }
      }
      async retrievePayment(
            paymentSessionData: Record<string, unknown>
      ): Promise<Record<string, unknown> | PaymentProcessorError> {
            try {
                  const headers = {
                        authorization: `Bearer ${this.tamara_token}`,
                  };


                  const response = await axios.get(`${this.tamara_api}/orders/${paymentSessionData.order_id}`, { headers });
                  const responseData = response.data;
                  return responseData;
            } catch (error) {
                  return error;
            }
      }

      async updatePayment(context: PaymentProcessorContext): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
            this.initiatePayment(context)
      }
}

export default MyPaymentProcessor;
