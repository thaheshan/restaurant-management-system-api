mport { Router } from "express";
import { getUsers, getUser, updateUser, deleteUser, toggleUserStatus, toggleFavorite, getMyProfile } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get(   "/",              authenticate, authorize("manager","super_admin"), getUsers);
router.get(   "/my-profile",    authenticate, getMyProfile);
router.get(   "/:id",           authenticate, getUser);
router.put(   "/:id",           authenticate, updateUser);
router.delete("/:id",           authenticate, authorize("super_admin"), deleteUser);
router.patch( "/:id/status",    authenticate, authorize("manager","super_admin"), toggleUserStatus);
router.post(  "/favorites",     authenticate, toggleFavorite);

export default router;
