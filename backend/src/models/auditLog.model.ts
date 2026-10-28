import { Schema, model, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: String, trim: true },
    ip: { type: String, trim: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

function rejectAuditMutation(): never {
  throw new Error('Audit logs are append-only');
}

auditLogSchema.pre('updateOne', rejectAuditMutation);
auditLogSchema.pre('updateMany', rejectAuditMutation);
auditLogSchema.pre('findOneAndUpdate', rejectAuditMutation);
auditLogSchema.pre('deleteOne', rejectAuditMutation);
auditLogSchema.pre('deleteMany', rejectAuditMutation);
auditLogSchema.pre('findOneAndDelete', rejectAuditMutation);
auditLogSchema.pre('save', function rejectExisting() {
  if (!this.isNew) {
    throw new Error('Audit logs are append-only');
  }
});

export interface IAuditLog {
  user?: Schema.Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AuditLog = model('AuditLog', auditLogSchema);
