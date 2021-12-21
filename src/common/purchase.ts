export type PurchaseDto = {
  id: number;
  date_created: Date;
  date_updated: Date;

  name: string;

  room: number;
  user: number;

  show_pgroup: number;
  show_price: number;
  show_qnty: number;
  show_weight: number;

  person_created: number;
  person_created_name: string;
  person_purchased: number;
  person_purchased_name: string;

  price_total: number;
  weight_total: number;
};
