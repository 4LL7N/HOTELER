/*
  Warnings:

  - Added the required column `expiresAt` to the `booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
