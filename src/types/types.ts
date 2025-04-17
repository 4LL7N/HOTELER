
enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
  }
  
  enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
  }
  
  enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
  }

export interface User {
    id: string;
    email: string;
    password: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    bookings?: Booking[];
  }
  
 export interface Room {
    id: string;
    number: string;
    type: string;
    price: number;
    capacity: number;
    isAvailable: boolean;
    amenities: string[];
    bookings?: Booking[]; 
  }
  
 export interface Booking {
    id: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    createdAt: Date;
    status: BookingStatus;
    userId: string;
    user?: User; 
    roomId: string;
    room?: Room; 
    payment?: Payment; 
  }
  
 export interface Payment {
    id: string;
    amount: number;
    method: string;
    status: PaymentStatus;
    bookingId: string;
    booking?: Booking; 
    createdAt: Date;
  }