import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('shli_person')
export class UserDao extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  // @Column()
  // date_updated: Date;

  // @Column()
  // date_created: Date;

  // @Column()
  // date_published: Date;

  @Column()
  published: number = 1;

  @Column()
  deleted: number = 0;

  @Column()
  manorder: number = 0;

  @Column({ name: 'ident' })
  name: string = '';

  @Column()
  email: string = '';

  @Column()
  phone: string = '';
}

export type UserDto = {
  id: number;
  name: string;
  email: string;
  phone: string;
};
