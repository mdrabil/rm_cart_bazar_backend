
import ProductModel from "../../models/Product.model.js";
import ProductNotifyModel from "../../models/ProductNotify.model.js";
import { buildStoreFilter } from "../../utils/accessHelper.js";


export const getAllNotifyRequests = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search,
      status,
      store,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    // Store permission
    const storeFilter = await buildStoreFilter(req.user, {
      field: "_id",
      storeId: store,
    });

    // Product filter
    const productFilter = {};

    if (Object.keys(storeFilter).length) {
      productFilter.store = storeFilter._id;
    }

    // Search on Product Name
    if (search) {
      productFilter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Get Products
    const products = await ProductModel.find(productFilter).select("_id");

    const productIds = products.map((item) => item._id);

    // Notify Filter
    const notifyFilter = {
      product: {
        $in: productIds,
      },
    };

    if (status) {
      notifyFilter.status = status;
    }

    const total = await ProductNotifyModel.countDocuments(notifyFilter);

    const data = await ProductNotifyModel.find(notifyFilter)
      .populate("customer", "name email mobile")
      .populate({
        path: "product",
        select: "name store",
        populate: {
          path: "store",
          select: "storeName mrStoreId",
        },
      })
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const updateNotifyStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;

        if (
            ![
                "Pending",
                "Notified",
                "Cancelled",
            ].includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid Status",

            });

        }

      const notify = await ProductNotifyModel.findById(id).populate("product");

if (!notify) {
  return res.status(404).json({
    success: false,
    message: "Request not found",
  });
}

// 🔐 ROLE VALIDATION
if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
  const store = await Store.findById(notify.product.store);

  if (req.user.roles.includes(USER_ROLE.VENDOR)) {
    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
  }

  if (
    [USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(role =>
      req.user.roles.includes(role)
    )
  ) {
    if (req.staffRoleStoreId.toString() !== store._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
  }
}

        notify.status = status;

        await notify.save();

        return res.json({

            success: true,

            message: "Status Updated",

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error",

        });

    }

};


export const deleteNotifyRequest = async (req, res) => {

    try {

        const { id } = req.params;

        const notify = await ProductNotifyModel.findById(id);

        if (!notify) {

            return res.status(404).json({

                success: false,

                message: "Request not found",

            });

        }

        await notify.deleteOne();

        return res.json({

            success: true,

            message: "Deleted Successfully",

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error",

        });

    }

};