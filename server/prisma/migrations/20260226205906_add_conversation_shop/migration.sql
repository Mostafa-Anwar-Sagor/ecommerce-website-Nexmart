-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "productId" TEXT,
ADD COLUMN     "shopId" TEXT;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
