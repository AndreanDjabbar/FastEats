import { 
    createMenuService,
    getMenusService,
    getMenuService,
    updateMenuService,
    deleteMenuService, 
    getMenuByRestaurantIdService,
    getMenuByMenuIdService
} from "../service/menuService.js"
import { getRestaurantByOwnerIdService } from "../service/restaurantService.js";
import { 
    validateCreateMenuRequest 
} from "../validator/menuValidator.js";

const createMenuController = async (req, res) => {
    const menuReq = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== 'seller') {
        return res.status(403).json({
            success: false,
            message: "Only sellers can create a menu"
        });
    }

    try {
        const restaurant = await getRestaurantByOwnerIdService(userId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found for this owner"
            });
        }

        menuReq.restaurantId = restaurant.restaurant_id;

        const errors = await validateCreateMenuRequest(menuReq);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors
            });
        }

        const newMenu = await createMenuService(menuReq);
        return res.status(201).json({
            success: true,
            message: "Menu created successfully",
            dataMenu: newMenu
        });
    } catch (err) {
        console.error("❌ Error creating menu:", err);

        if (err.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Menu name already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


const getMenusController = async(req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;

    if(role !== 'seller') {
        return res.status(403).json({
            success: false,
            message: "Only sellers can get menus"
        });
    }

    const restaurant = await getRestaurantByOwnerIdService(userId);
    if(!restaurant) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found for this owner"
        });
    }

    try {
        const result = await getMenusService(restaurant.restaurant_id);

        return res.status(200).json({
            success: true,
            menus: result
        })
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const getMenuByRestoIdController = async(req, res) => {
    const restaurantId = req.params.restaurantId;
    try {
        const result = await getMenuByRestaurantIdService(restaurantId);

        return res.status(200).json({
            success: true,
            menus: result
        })
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const getMenuByMenuIdController = async(req, res) => {
    try {
        const { menuId } = req.params;

        if (!menuId || isNaN(menuId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menuId"
            });
        }

        const result = await getMenuByMenuIdService(menuId);
        console.log(result)
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Menu not found"
            });
        }

        return res.status(200).json({
            success: true,
            restaurant: result
        });
    } catch (err) {
        console.error("❌ Error in getMenuByMenuIdController:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

const updateMenuController = async(req, res) => {

}

const deleteMenuController = async(req, res) => {

}

export {
    createMenuController,
    getMenusController,
    getMenuByMenuIdController,
    updateMenuController,
    deleteMenuController,
    getMenuByRestoIdController
};