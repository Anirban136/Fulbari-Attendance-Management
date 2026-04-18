-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hashedPin" TEXT NOT NULL,
    "monthlySalary" REAL NOT NULL,
    "joiningDate" DATETIME NOT NULL,
    "leavingDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT NOT NULL DEFAULT 'Restaurant',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffProfile_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "StaffSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StaffProfile" ("createdAt", "hashedPin", "id", "isActive", "joiningDate", "leavingDate", "monthlySalary", "name", "phone", "slotId") SELECT "createdAt", "hashedPin", "id", "isActive", "joiningDate", "leavingDate", "monthlySalary", "name", "phone", "slotId" FROM "StaffProfile";
DROP TABLE "StaffProfile";
ALTER TABLE "new_StaffProfile" RENAME TO "StaffProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
