-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Advance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Advance" ("amount", "createdAt", "date", "id", "staffId", "status") SELECT "amount", "createdAt", "date", "id", "staffId", "status" FROM "Advance";
DROP TABLE "Advance";
ALTER TABLE "new_Advance" RENAME TO "Advance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
