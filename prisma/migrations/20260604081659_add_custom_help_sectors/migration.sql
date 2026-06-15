-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customHelpSectors" TEXT[] DEFAULT ARRAY[]::TEXT[];
