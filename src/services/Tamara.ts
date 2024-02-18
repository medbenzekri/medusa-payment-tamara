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
      private    cart: Cart;
      private    itemsService: itemsService;
      private    logger : Logger;
      constructor({ itemsService, logger }) {
            super(arguments[0]);
            this.itemsService = itemsService;
            this.logger = logger;
      }
      updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
            throw new Error("1");
      }

      static identifier = "Tamara";

      async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
            const cart = this.cart;
            const amount = cart.total
            try {
                  var id;
                  if (paymentSessionData.hasOwnProperty("payment")) {
                        // @ts-ignore
                        id = paymentSessionData.payment.id;
                  } else {
                        id = paymentSessionData.id;
                  }
                  
                  const data = {
                        "order_id": id,
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
                        authorization: `Bearer ${process.env.TAMARA_TOKEN}`,
                  };




                  await axios.post(`${process.env.TAMARA_API}/payments/capture`, data, { headers });
                  return await this.retrievePayment(paymentSessionData);
            } catch (error) {
                  console.log(error.message);

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

                  const id = paymentSessionData.order_id
                  const headers = {
                        authorization: `Bearer ${process.env.TAMARA_TOKEN}`,
                  };
                  const res = await axios.post(`${process.env.TAMARA_API}/orders/${id}/authorise`, {}, { headers })


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
            return {
                  id: "cancel",
            }
      }
      async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
            
            const cart = await this.itemsService.getCart(context.resource_id);
            this.cart = cart;
            this.logger.info(`Initiating payment for cart ${context.resource_id}`);
            const currency_code = cart.region.currency_code.toUpperCase();
            const price = context.amount / 100;

            

            const data = {
                  "order_reference_id": context.resource_id,
                  "total_amount": {
                        "amount": price,
                        "currency": currency_code
                  },
                  "description": `Customer Order n° ${context.resource_id} with total of ${humanizeAmount(context.amount, context.currency_code)}`,
                  "country_code": currency_code.slice(0, 2),
                  "payment_type": "PAY_BY_INSTALMENTS",
                  "instalments": 3, 
                  "items": await this.itemsService.getitems(context),
                  "consumer": {
                        "first_name": cart.customer?.first_name|| "Guest",
                        "last_name": cart.customer?.last_name || "Customer",
                        "phone_number": cart.customer?.phone || "+966500000001",
                        "email": cart.customer?.email || "",
                  },
                  "shipping_address": {
                        "first_name": cart.customer?.first_name || "Guest",
                        "last_name": cart.customer?.last_name || "Customer",
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
                        "success": `${process.env.WEB_ENDPOINT}/checkout`,
                        "failure": `${process.env.WEB_ENDPOINT}/failure`,
                        "cancel": `${process.env.WEB_ENDPOINT}/cancel`,
                        "notification": "https://example.com/payments/tamarapay"
                  },
                  "platform": "medusa"

            }

            const config = {
                  headers: {
                        Authorization: `Bearer ${process.env.TAMARA_TOKEN}`,
                  },
            };
            this.logger.info(`data: ${JSON.stringify(data)}`);
            const url = `${process.env.TAMARA_API}/checkout`;
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
            return PaymentSessionStatus.AUTHORIZED
      }
      async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown> | PaymentProcessorError> {


            try {
                  var id;
                  if (paymentSessionData.hasOwnProperty("payment")) {
                        // @ts-ignore
                        id = paymentSessionData.payment.id;
                  } else {
                        id = paymentSessionData.id;
                  }

                  const amount = refundAmount / 100
                  const payment_id = id
                  const data = {

                        "total_amount":

                        {
                              amount: amount,
                              currency: this.cart.region.currency_code
                        },
                        "comment": `Refund for the order ${id}`

                  }




                  const headers = {
                        authorization: `Bearer ${process.env.TAMARA_TOKEN}`,
                  };


                  await axios.post(`https://api-sandbox.tamara.co/payments/simplified-refund/${payment_id}`, data, { headers });

                  return await this.retrievePayment(paymentSessionData);
            } catch (error) {
                  return error;
            }
      }
      async retrievePayment(
            paymentSessionData: Record<string, unknown>
      ): Promise<Record<string, unknown> | PaymentProcessorError> {
            try {
                  var id;
                  if (paymentSessionData.hasOwnProperty("payment")) {
                        // @ts-ignore
                        id = paymentSessionData.payment.id;
                  } else {
                        id = paymentSessionData.id;
                  }

                  const headers = {
                        authorization: `Bearer ${process.env.TAMARA_TOKEN}`,
                  };


                  const response = await axios.get(`${process.env.TAMARA_API}/orders/${id}`, { headers });
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
