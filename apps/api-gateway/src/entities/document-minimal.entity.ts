import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';

@Entity('documents')
export class DocumentMinimal {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  uploadedBy: string;

  @Column()
  uploadedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}
