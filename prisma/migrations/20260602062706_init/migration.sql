-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'O_POS', 'O_NEG', 'AB_POS', 'AB_NEG');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('DOCTOR', 'ENGINEER', 'LAWYER', 'TEACHER', 'BUSINESS', 'STUDENT', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "HelpSector" AS ENUM ('MEDICAL', 'LEGAL', 'TECH', 'FINANCE', 'TRANSPORT', 'EDUCATION', 'CONSTRUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('CRITICAL', 'NORMAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SosType" AS ENUM ('MEDICAL', 'BLOOD', 'FINANCIAL', 'TRANSPORT', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('NOTICE', 'EVENT', 'IMPORTANT', 'INFO');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('JOB_REFERRAL', 'PROFESSIONAL_HELP', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "photoUrl" TEXT,
    "bio" VARCHAR(160),
    "bloodGroup" "BloodGroup" NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "profession" "Profession" NOT NULL,
    "professionCustom" TEXT,
    "workplace" TEXT NOT NULL,
    "helpSectors" "HelpSector"[],
    "birthdate" TIMESTAMP(3),
    "lastDonationDate" TIMESTAMP(3),
    "availableAfter" TIMESTAMP(3),
    "fcmToken" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "hospital" TEXT NOT NULL,
    "patientGender" TEXT,
    "patientAge" INTEGER,
    "contactNumber" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL',
    "note" VARCHAR(200),
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requesterId" TEXT NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SosRequest" (
    "id" TEXT NOT NULL,
    "sosType" "SosType" NOT NULL,
    "description" VARCHAR(280) NOT NULL,
    "city" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requesterId" TEXT NOT NULL,

    CONSTRAINT "SosRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "postType" "PostType" NOT NULL DEFAULT 'INFO',
    "imageUrl" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "category" "JobCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "profession" "Profession",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosRequest" ADD CONSTRAINT "SosRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
