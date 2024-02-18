import {
    CartService ,
    Cart as MedusaCart,

} from "@medusajs/medusa";

import { item } from "../types/types";
import { humanizeAmount } from "medusa-core-utils"

class ItemsService {
    private cartService: CartService;

    constructor({cartService }) {
        this.cartService = cartService;
    }

    async getCart(id: string): Promise<MedusaCart> {
        return this.cartService.retrieveWithTotals(id,{ relations: ["region", "items", "items.variant","customer","shipping_methods"]});
    }
    async getitems(context): Promise<item[]> {
        const cart = await this.getCart(context.resource_id);
        console.log(cart);
        const currency_code= cart.region.currency_code.toUpperCase();
        const items = cart.items;
        const itemsArray = items.map((item) => {
            return {
                reference_id: item.variant.id,
                type: "physical",
                name: item.title,
                sku: item.variant.sku || item.variant.id,
                quantity: item.quantity,
                total_amount: {
                    amount:  humanizeAmount(item.unit_price, currency_code),
                    currency: currency_code
                }
            };
        });
        return itemsArray;

    }
}   


export default ItemsService;

