import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

export interface RoomData {
  roomId: string;
  code: string;
  language: string;
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
}

export const getRoomData = async (roomId: string) => {
  try {
    const roomDocRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomDocRef);
    
    if (roomSnap.exists()) {
      const data = roomSnap.data() as RoomData;
      return {
        roomId: roomSnap.id,
        code: data.code,
        language: data.language,
        createdAt: data.createdAt,
        lastUpdated: data.lastUpdated,
      };
    } else {
      console.log("No such room exists!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching room data:", error);
    return null;
  }
};