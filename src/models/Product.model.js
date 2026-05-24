

import mongoose from "mongoose";

import {
  PRODUCT_STATUS,
  USER_ROLE,
} from "../constants/enums.js";

import { generateRMId }
  from "../utils/rmId.js";

const productSchema =
  new mongoose.Schema(
    {
      // =========================
      // BASIC
      // =========================

      rmProductId: {
        type: String,
        unique: true,
        index: true,
      },

      store: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Store",

        required: true,

        index: true,
      },

      category: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Category",

        required: true,

        index: true,
      },

      subCategory: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Category",

        default: null,

        index: true,
      },

      name: {
        type: String,

        required: true,

        trim: true,

        index: true,
      },

      slug: {
        type: String,

        unique: true,

        index: true,
      },

        label: { type: String, required: true, default:"Size" },

      shortDescription: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },

      brand: {
        type: String,
        default: "",
      },

      material: {
        type: String,
        default: "",
      },

      fitType: {
        type: String,
        default: "",
      },

      // =========================
      // PRODUCT IMAGES
      // =========================

      images: [
        {
          url: String,
          public_id: String,
        },
      ],

      thumbnails: [
        {
          url: String,
          public_id: String,
        },
      ],



      colors: [
        {
          colorName: {
            type: String,
          },

          colorCode: {
            type: String,
            default: "#000000",
          },

          images: [
            {
              url: String,
              public_id: String,
            },
          ],

          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],



      variants: [
        {
          value: {
            type: String,
            default: "",
          },

          size: {
            type: String,
            default: "",
          },

          color: {
            type: String,
            default: "",
          },

          sku: {
            type: String,
            default: "",
          },

          mrp: {
            type: Number,
            required: true,
          },

          sellingPrice: {
            type: Number,
            required: true,
          },

          stockQty: {
            type: Number,
            default: 0,
          },

        

          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],

   

      customization: {
        enabled: {
          type: Boolean,
          default: false,
        },

  

        areaImages: {
          front: {
            url: String,
            public_id: String,
          },

          back: {
            url: String,
            public_id: String,
          },

          leftSleeve: {
            url: String,
            public_id: String,
          },

          rightSleeve: {
            url: String,
            public_id: String,
          },

          pocket: {
            url: String,
            public_id: String,
          },
        },

    
        areas: {
          front: {
            enabled: {
              type: Boolean,
              default: true,
            },

            width: {
              type: Number,
              default: 300,
            },

            height: {
              type: Number,
              default: 300,
            },
          },

          back: {
            enabled: {
              type: Boolean,
              default: false,
            },

            width: {
              type: Number,
              default: 300,
            },

            height: {
              type: Number,
              default: 300,
            },
          },

          leftSleeve: {
            enabled: {
              type: Boolean,
              default: false,
            },

            width: {
              type: Number,
              default: 120,
            },

            height: {
              type: Number,
              default: 120,
            },
          },

          rightSleeve: {
            enabled: {
              type: Boolean,
              default: false,
            },

            width: {
              type: Number,
              default: 120,
            },

            height: {
              type: Number,
              default: 120,
            },
          },

          pocket: {
            enabled: {
              type: Boolean,
              default: false,
            },

            width: {
              type: Number,
              default: 100,
            },

            height: {
              type: Number,
              default: 100,
            },
          },
        },

  
        layers: [
          {
            type: {
              type: String,

              enum: [
                "text",
                "image",
              ],

              required: true,
            },
            id: {
  type: String,
  unique: true,
  index: true,
},

            area: {
              type: String,

              enum: [
                "front",
                "back",
                "leftSleeve",
                "rightSleeve",
                "pocket",
              ],

              required: true,
            },

   
            text: {
              type: String,
              default: "",
            },

            fontSize: {
              type: Number,
              default: 24,
            },

            fontFamily: {
              type: String,
              default: "Arial",
            },

            bold: {
              type: Boolean,
              default: false,
            },

            curved: {
              type: Boolean,
              default: false,
            },

            curveRadius: {
              type: Number,
              default: 120,
            },

            color: {
              type: String,
              default: "#000000",
            },

            image: {
              url: String,
              public_id: String,
            },

     
            x: {
              type: Number,
              default: 0,
            },

            y: {
              type: Number,
              default: 0,
            },

            width: {
              type: Number,
              default: 120,
            },

            height: {
              type: Number,
              default: 120,
            },

            rotation: {
              type: Number,
              default: 0,
            },

            opacity: {
              type: Number,
              default: 1,
            },

            isLocked: {
              type: Boolean,
              default: false,
            },

            isVisible: {
              type: Boolean,
              default: true,
            },
          },
        ],
      },

      // =========================
      // SEO
      // =========================

      tags: [String],

      metaTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      // =========================
      // EXTRA ATTRIBUTES
      // =========================

      attributes: {
        type: Map,

        of:
          mongoose.Schema.Types
            .Mixed,
      },

      // =========================
      // GST
      // =========================

      gstPercent: {
        type: Number,
        default: 0,
      },

      // =========================
      // RATINGS
      // =========================

      averageRating: {
        type: Number,
        default: 0,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },

      // =========================
      // STATUS
      // =========================

      status: {
        type: String,

        enum:
          Object.values(
            PRODUCT_STATUS
          ),

        default:
          PRODUCT_STATUS.ACTIVE,

        index: true,
      },

      // =========================
      // CREATOR
      // =========================

      createdBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      allowedCreatorRoles: {
        type: [String],

        enum:
          Object.values(
            USER_ROLE
          ),

        default: [
          USER_ROLE.VENDOR,

          USER_ROLE
            .STORE_MANAGER,

          USER_ROLE.CHEF,
        ],
      },
    },

    {
      timestamps: true,
    }
  );

// =========================
// AUTO RM PRODUCT ID
// =========================

productSchema.pre(
  "save",
  async function (next) {
    try {
      if (!this.rmProductId) {
        this.rmProductId =
          await generateRMId(
            "RMP",
            "PRODUCT"
          );
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);

// =========================
// INDEXES
// =========================

productSchema.index({
  name: "text",

  description: "text",

  brand: "text",
});

productSchema.index({
  category: 1,
});

productSchema.index({
  subCategory: 1,
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({
  status: 1,
});

export default mongoose.model(
  "Product",
  productSchema
);