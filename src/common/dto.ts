export type Login = {
  phone: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type Room = {
  id: number;
  name: string;
  users: User[];
};

export type Rooms = {
  rooms: Room[];
};

export type Purchase = {
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

export type Message = {
  id: number;
  date_created: Date;
  date_updated: Date;

  content: string;
  room: number;
  user: number;
  user_name: string;

  purchaseId?: number;
  purchase?: Purchase;
};

export type GetMessages = {
  room: number;
  fromMessageId: number;
};

export type Messages = {
  room: number;
  messages: Message[];
  lastMessageId: number;
};
