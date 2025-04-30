// __tests__/cartItem.test.ts
import prisma from "../../prismaClient";
import jwt from "jsonwebtoken";
import app from "../../server";
import supertest from "supertest";
import { cartItem } from "@prisma/client";
import { metaType } from "../../types/cartItemTypes";
import { createJWT } from "../../modules/auth";

// jest.mock("../../prismaClient");
// jest.mock("jsonwebtoken");

const mockUser = {
  id: "97837d5f-2cdb-407f-840b-a88894b3a73a",
  email: "nika",
};

const mockAdmin = {
  id: "805bf9e1-4651-434a-82db-3016b8505cbd",
  email: "nika@gmail.com",
};

const mockUserWithCartItem = {
  id: "97837d5f-2cdb-407f-840b-a88894b3a73a",
  email: "nika@gmail.com",
};
const adminToken = createJWT(mockAdmin);
const userToken = createJWT(mockUser);
const mockUserWithCartItemToken = createJWT(mockUserWithCartItem)
const generateToken = (user: any) => `Bearer ${jwt.sign(user, "secret")}`;

describe("Cart Items API", () => {
  describe("GET /api/cartItem", () => {
    it("should return 401 without authentication", async () => {
      const response = await supertest(app).get("/api/cartItem");

      expect(response.status).toBe(401);
    });

    it("should return 200 with user-specific cart items for regular users", async () => {
      const response = await supertest(app)
        .get("/api/cartItem")
        .set("Authorization", `Bearer ${userToken}`);

      expect([200, 404]).toContain(response.status);
      if (response.status != 404) {
        expect(["success", "fail"]).toContain(response.body.status);
        expect(response.body.results).toBeGreaterThanOrEqual(0);
      }
    });

    it("should allow filtering by userId for admins", async () => {
      const response = await supertest(app)
        .get(`/api/cartItem?userId=${mockUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.body.cartItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: mockUser.id }),
        ])
      );
    });
  });

  describe("POST /api/cartItem", () => {
    const validPayload = {
      roomId: "ed160b47-89a6-4cfa-919d-813c3cdd79bd",
      checkIn: "2025-05-25",
      checkOut: "2025-05-27",
      adults: 2,
      children: 1,
    };

    const inValidPayload = {
      checkIn: "2025-05-25",
      checkOut: "2025-05-27",
      adults: 2,
      children: 1,
    };

    it("should return 401 without authentication", async () => {
      const response = await supertest(app)
        .post("/api/cartItem")
        .send(validPayload);

      expect(response.status).toBe(401);
    });

    it("should return 400 with invalid payload", async () => {
      const response = await supertest(app)
        .post("/api/cartItem")
        .set("Authorization", `Bearer ${userToken}`)
        .send(inValidPayload);

      expect(response.status).toBe(400);
    });

    it("should create new cart item with valid data", async () => {
      const response = await supertest(app)
        .post("/api/cartItem")
        .set("Authorization", `Bearer ${userToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.newCartItem).toBeDefined();
    });

    it("should return 400 for invalid dates", async () => {
      const response = await supertest(app)
        .post("/api/cartItem")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ ...validPayload, checkOut: "2020-01-01" });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/cartItem/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await supertest(app)
        .patch("/api/cartItem/4ec96027-67c6-4370-9ec7-524bdf8997855")
        .send({ adults: 3 });

      expect(response.status).toBe(401);
    });

    it("should return 404 if cart item with provided id does not exists", async () => {
      const response = await supertest(app)
        .patch("/api/cartItem/4ec96027-67c6-4370-9ec7-524bdf89978")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ adults: 3 });

      expect(response.status).toBe(404);
    });

    it("should update cart item with valid data", async () => {
      const response = await supertest(app)
        .patch("/api/cartItem/4ec96027-67c6-4370-9ec7-524bdf899785")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ adults: 3 });

      expect(response.status).toBe(200);
      expect(response.body.newCartItem.adults).toBe(3);
    });

    it("should return 400 for invalid date combinations", async () => {
      const response = await supertest(app)
        .patch("/api/cartItem/4ec96027-67c6-4370-9ec7-524bdf899785")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ checkIn: "2025-05-27", checkOut: "2025-05-25" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/before check-out/);
    });
  });

  describe("DELETE /api/cartItem/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await supertest(app).delete(
        "/api/cartItem/e13f8487-4898-4c81-bf9a-9f35609da4ba"
      );

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent item with this id", async () => {
      const response = await supertest(app)
        .delete("/api/cartItem/4ec96027-67c6-4370-9ec7-524bd")
        .set("Authorization", `Bearer ${mockUserWithCartItemToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent item for this user",async()=>{
        const response = await supertest(app)
        .delete("/api/cartItem/e13f8487-4898-4c81-bf9a-9f35609da4ba")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    })
    
    it("should delete existing cart item", async () => {
      const response = await supertest(app)
        .delete("/api/cartItem/e13f8487-4898-4c81-bf9a-9f35609da4ba")
        .set("Authorization", `Bearer ${mockUserWithCartItemToken}`);

      expect(response.status).toBe(204);
    });
  });
});
