import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({ enum: ['email', 'google'], default: 'email' })
  provider: 'email' | 'google';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
