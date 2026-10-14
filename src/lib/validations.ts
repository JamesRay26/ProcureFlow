import { z } from 'zod';

// Week 7 Checklist: Runtime Validation Boundaries (Zod)
// Parse every incoming API/form payload through safeParse() before handing to Prisma CRUD methods.

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().min(1, 'Category is required').max(50),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  maxStock: z.number().int().min(1, 'Max stock must be at least 1'),
  threshold: z.number().int().min(0, 'Threshold cannot be negative'),
  warehouse: z.string().min(1, 'Warehouse location is required'),
});

export const requestCreationSchema = z.object({
  itemId: z.string().uuid('Valid item ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['Low', 'Medium', 'High']),
  justification: z.string().optional(),
});

export const requestUpdateSchema = z.object({
  requestId: z.string().uuid('Valid request ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['Low', 'Medium', 'High']),
  justification: z.string().optional(),
});

export const approvalActionSchema = z.object({
  requestId: z.string().uuid('Valid request ID is required'),
  notes: z.string().max(500).optional(),
});
