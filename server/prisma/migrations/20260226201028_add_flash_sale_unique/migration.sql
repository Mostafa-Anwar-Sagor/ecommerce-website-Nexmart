/*
  Warnings:

  - A unique constraint covering the columns `[flashSaleId,productId]` on the table `FlashSaleProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FlashSaleProduct_flashSaleId_productId_key" ON "FlashSaleProduct"("flashSaleId", "productId");
