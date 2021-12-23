import { NewPurchaseDto } from './newPurchaseDto';

export type NewMessageDto = {
  room: number;
  user: number;
  content: string;
  purchase?: NewPurchaseDto;
};
