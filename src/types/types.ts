export interface item {
    reference_id: string;
    type: string;
    name: string;
    sku: string;
    quantity: number;
    total_amount: {
                amount: number; 
                currency: string
            };
}
