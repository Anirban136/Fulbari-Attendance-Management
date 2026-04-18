-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shiftStartTime" TEXT NOT NULL,
    "shiftEndTime" TEXT NOT NULL,
    "expectedWorkHours" REAL NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StaffSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffSlot_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hashedPin" TEXT NOT NULL,
    "monthlySalary" REAL NOT NULL,
    "joiningDate" DATETIME NOT NULL,
    "leavingDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffProfile_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "StaffSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "shiftDate" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BreakLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendanceId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    CONSTRAINT "BreakLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "AttendanceRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Advance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "strictSalary" REAL NOT NULL,
    "simpleSalary" REAL NOT NULL,
    "selectedMode" TEXT,
    "finalPayable" REAL NOT NULL,
    "advancesDeducted" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffSlot_qrToken_key" ON "StaffSlot"("qrToken");
