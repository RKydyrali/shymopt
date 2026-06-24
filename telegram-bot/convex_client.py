import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

CONVEX_URL = os.getenv("CONVEX_URL", "")


class ConvexClient:
    def __init__(self):
        self.url = CONVEX_URL

    async def _query(self, function_path: str, args: dict = None) -> any:
        async with aiohttp.ClientSession() as session:
            payload = {"path": function_path, "args": args or {}}
            async with session.post(
                f"{self.url}/api/query",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as resp:
                if resp.status != 200:
                    raise Exception(f"Convex query error: {resp.status}")
                data = await resp.json()
                return data.get("status") == "success" and data.get("value")

    async def _mutation(self, function_path: str, args: dict = None) -> any:
        async with aiohttp.ClientSession() as session:
            payload = {"path": function_path, "args": args or {}}
            async with session.post(
                f"{self.url}/api/mutation",
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as resp:
                if resp.status != 200:
                    raise Exception(f"Convex mutation error: {resp.status}")
                data = await resp.json()
                return data.get("status") == "success" and data.get("value")

    async def link_telegram_account(self, user_id: str, telegram_id: int) -> any:
        return await self._mutation(
            "users:linkTelegramAccount",
            {"userId": user_id, "telegramId": telegram_id},
        )

    async def get_farmer_by_telegram(self, telegram_id: int) -> dict | None:
        return await self._query(
            "users:getByTelegramId",
            {"telegramId": telegram_id},
        )

    async def get_farmer_orders(self, farmer_id: str) -> list:
        return (
            await self._query(
                "orders:getByFarmer",
                {"farmerId": farmer_id},
            )
            or []
        )

    async def get_farmer_stats(self, farmer_id: str) -> dict:
        return await self._query(
            "orders:getFarmerStats",
            {"farmerId": farmer_id},
        ) or {
            "today": {"count": 0, "total": 0},
            "week": {"count": 0, "total": 0},
            "month": {"count": 0, "total": 0},
        }

    async def get_farmer_lots(self, farmer_id: str) -> list:
        return (
            await self._query(
                "lots:getByFarmer",
                {"farmerId": farmer_id},
            )
            or []
        )

    async def update_order_status(self, order_id: str, status: str) -> any:
        return await self._mutation(
            "orders:updateStatus",
            {"orderId": order_id, "status": status},
        )

    async def create_lot(self, lot_data: dict) -> str:
        return await self._mutation(
            "lots:createFromTelegram",
            lot_data,
        )

    async def update_session(self, session_id: str, data: dict) -> any:
        return await self._mutation(
            "telegram:updateSession",
            {"sessionId": session_id, **data},
        )

    async def get_session(self, telegram_id: int) -> dict | None:
        return await self._query(
            "telegram:getSessionByTelegramId",
            {"telegramId": telegram_id},
        )

    async def create_session(self, farmer_id: str, telegram_id: int) -> str:
        return await self._mutation(
            "telegram:createSession",
            {"farmerId": farmer_id, "telegramId": telegram_id},
        )
