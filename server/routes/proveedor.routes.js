import { Router } from "express";
import {create, findAll, findOne, update, remove} from "../controllers/proveedor.controller.js";


const router = Router();


router.post("/", create);      
router.get("/", findAll);      
router.get("/:id", findOne);   
router.put("/:id", update);    
router.delete("/:id", remove);

export default router;