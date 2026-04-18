-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Advance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Advance" ("amount", "createdAt", "date", "id", "staffId", "status") SELECT "amount", "createdAt", "date", "id", "staffId", "status" FROM "Advance";
DROP TABLE "Advance";
ALTER TABLE "new_Advance" RENAME TO "Advance";
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "shiftDate" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("createdAt", "endTime", "id", "shiftDate", "staffId", "startTime", "state", "updatedAt") SELECT "createdAt", "endTime", "id", "shiftDate", "staffId", "startTime", "state", "updatedAt" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE TABLE "new_PayrollRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "strictSalary" REAL NOT NULL,
    "simpleSalary" REAL NOT NULL,
    "selectedMode" TEXT,
    "finalPayable" REAL NOT NULL,
    "advancesDeducted" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PayrollRecord" ("advancesDeducted", "createdAt", "finalPayable", "id", "monthYear", "selectedMode", "simpleSalary", "staffId", "strictSalary") SELECT "advancesDeducted", "createdAt", "finalPayable", "id", "monthYear", "selectedMode", "simpleSalary", "staffId", "strictSalary" FROM "PayrollRecord";
DROP TABLE "PayrollRecord";
ALTER TABLE "new_PayrollRecord" RENAME TO "PayrollRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
