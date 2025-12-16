const DB_NAME = "posDB";
const PRODUCT_STORE = "products";
const CATEGORY_STORE = "categories";
const CART_STORE = "cart";
const VIEW_STORE = "view";
const ORDERS_STORE = "orders";
const ORDERS_PAGE = "ordersPage";
const SETTINGS_STORE = "pdfSettings";
const ON_HOLD_CARTS_STORE = "onHoldCarts";
const CUSTOMER_STORE = "customers";
const EMPLOYEE_STORE = "employees";
const VERSION = 1;

// Open IndexedDB connection (Client-Side Only)
const openDB = () => {
  if (typeof window === "undefined") {
    console.error("IndexedDB is not available on the server.");
    return Promise.reject(new Error("IndexedDB is not available on the server."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        db.createObjectStore(PRODUCT_STORE, { keyPath: "uid" });
      }
      if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
        db.createObjectStore(CATEGORY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CART_STORE)) {
        db.createObjectStore(CART_STORE, { keyPath: "uid", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(VIEW_STORE)) {
        db.createObjectStore(VIEW_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ORDERS_STORE)) {
        db.createObjectStore(ORDERS_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(ORDERS_PAGE)) {
        db.createObjectStore(ORDERS_PAGE, { keyPath: "increment_id" });
      }
      if (!db.objectStoreNames.contains(ON_HOLD_CARTS_STORE)) {
        db.createObjectStore(ON_HOLD_CARTS_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CUSTOMER_STORE)) {
        const customerStore = db.createObjectStore(CUSTOMER_STORE, { keyPath: "id" });
        customerStore.createIndex("name", "name", { unique: false });
        customerStore.createIndex("email", "email", { unique: false });
      }
      if (!db.objectStoreNames.contains(EMPLOYEE_STORE)) {
        const employeeStore = db.createObjectStore(EMPLOYEE_STORE, { keyPath: "id" });

        employeeStore.createIndex("firstname", "firstname", { unique: false });
        employeeStore.createIndex("lastname", "lastname", { unique: false });
        employeeStore.createIndex("email", "email", { unique: false });
        employeeStore.createIndex("username", "username", { unique: false });
      }


    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Save products in IndexedDB
export const saveProducts = async (products) => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(PRODUCT_STORE, "readwrite");
    const store = tx.objectStore(PRODUCT_STORE);
    products.forEach((product) => {
      store.put(product);
    });
    await tx.done;
  } catch (error) {
    console.error("Failed to save products:", error);
  }
};

// Add this function to your db.js file
export const updateProductInDB = async (uid, updatedData) => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(PRODUCT_STORE, "readwrite");
    const store = tx.objectStore(PRODUCT_STORE);

    // Get existing product
    const product = await store.get(uid);
    if (!product) {
      console.warn(`Product with UID ${uid} not found in IndexedDB`);
      return;
    }

    // Merge updates while preserving Magento-specific structure
    const updatedProduct = {
      ...product,
      name: updatedData.name || product.name,
      sku: updatedData.sku || product.sku,
      special_price: updatedData.special_price ?? product.special_price,
      quantity: updatedData.inventory ?? product.quantity,
      // Update price structure
      price: {
        ...product.price,
        regularPrice: {
          ...product.price?.regularPrice,
          amount: {
            ...product.price?.regularPrice?.amount,
            value: updatedData.price ?? product.price?.regularPrice?.amount?.value
          }
        }
      }
    };

    // Handle image updates
    if (updatedData.image) {
      if (updatedData.image.startsWith("data:image")) {
        // Base64 image (new upload)
        updatedProduct.image = {
          ...(product.image || {}),
          url: updatedData.image
        };
        updatedProduct.image_url = updatedData.image;
      } else {
        // URL string (existing image)
        updatedProduct.image = {
          ...(product.image || {}),
          url: updatedData.image
        };
      }
    }

    // Update in IndexedDB
    await store.put(updatedProduct);
    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to update product in IndexedDB:", error);
    return false;
  }
};

// Get products from IndexedDB
export const getProducts = async () => {
  if (typeof window === "undefined") return [];

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRODUCT_STORE, "readonly");
      const store = tx.objectStore(PRODUCT_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
};

export const clearCategories = async () => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(CATEGORY_STORE, "readwrite");
    await tx.objectStore(CATEGORY_STORE).clear();
    await tx.done;
  } catch (error) {
    console.error("Failed to clear categories:", error);
  }
};

export const clearAllProducts = async () => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRODUCT_STORE, "readwrite");
      const store = tx.objectStore(PRODUCT_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("All products deleted from IndexedDB.");
        resolve();
      };

      request.onerror = (event) => {
        console.error("Failed to clear products:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Error opening DB or clearing store:", error);
  }
};
// Save categories in IndexedDB
// Save categories to IndexedDB
export const saveCategories = async (categories) => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(CATEGORY_STORE, "readwrite");
    const store = tx.objectStore(CATEGORY_STORE);

    // Clear existing categories first
    await store.clear();

    // Add all categories
    for (const category of categories) {
      await store.put(category);
    }

    await tx.done;
  } catch (error) {
    console.error("Failed to save categories:", error);
  }
};

// Get categories from IndexedDB
export const getCategories = async () => {
  if (typeof window === "undefined") return [];

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CATEGORY_STORE, "readonly");
      const store = tx.objectStore(CATEGORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};
// export const addToCart = async (product, options, quantity) => {
//   if (typeof window === "undefined") return false;

//   try {
//     const db = await openDB();
//     const tx = db.transaction(CART_STORE, "readwrite");
//     const store = tx.objectStore(CART_STORE);

//     // Normalize options to array of objects [{attribute_id: option_id}, ...]
//     const normalizedOptions = options.map(opt => {
//       if (Array.isArray(opt) && opt.length === 2) {
//         // Convert array format to object format
//         return { [parseInt(opt[0])]: parseInt(opt[1]) };
//       } else if (typeof opt === "object" && opt !== null && "attribute_id" in opt && "option_id" in opt) {
//         // Convert object with attribute_id/option_id to required format
//         return { [parseInt(opt.attribute_id)]: parseInt(opt.option_id) };
//       } else if (typeof opt === "object" && opt !== null && Object.keys(opt).length === 1) {
//         // Already in correct format, ensure values are numbers
//         const key = Object.keys(opt)[0];
//         return { [parseInt(key)]: parseInt(opt[key]) };
//       }
//       throw new Error("Invalid option format");
//     });

//     // Check for existing item - comparing objects
//     const existingItem = await new Promise((resolve, reject) => {
//       const getAllRequest = store.getAll();
//       getAllRequest.onsuccess = () => {
//         const existingItem = getAllRequest.result.find(
//           item => item.product.uid === product.uid && 
//                  areOptionsEqual(item.selected_options, normalizedOptions)
//         );
//         resolve(existingItem);
//       };
//       getAllRequest.onerror = (event) => reject(event.target.error);
//     });

//     if (existingItem) {
//       existingItem.quantity += quantity;
//       await new Promise((resolve, reject) => {
//         const putRequest = store.put(existingItem);
//         putRequest.onsuccess = () => resolve();
//         putRequest.onerror = (event) => reject(event.target.error);
//       });
//     } else {
//       const newItem = {
//         product: product,
//         selected_options: normalizedOptions,
//         quantity: quantity,
//         addedAt: Date.now(),
//         uid: Date.now()
//       };
//       await new Promise((resolve, reject) => {
//         const putRequest = store.put(newItem);
//         putRequest.onsuccess = () => resolve();
//         putRequest.onerror = (event) => reject(event.target.error);
//       });
//     }

//     await tx.done;
//     return true;
//   } catch (error) {
//     console.error("Failed to add to cart:", error);
//     return false;
//   }
// };

export const addToCart = async (product, options, quantity, taxAmount) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    let resultUid = null;

    // Use a unique way to identify existing items
    const existingItem = await new Promise((resolve, reject) => {
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const existingItem = getAllRequest.result.find(
          item => {
            // Basic check: UID matches and options match
            const basicMatch = item.product.uid === product.uid &&
              JSON.stringify(item.selected_options) === JSON.stringify(options);

            if (!basicMatch) return false;

            // STRICT CHECK: Verify parent product ID matches if available
            // This handles cases where different parent products share the same variant UID
            if (product.product_id) {
              if (item.product.product_id) {
                return product.product_id === item.product.product_id;
              }
              // If incoming has ID but existing doesn't, assume different to be safe
              return false;
            }

            return true;
          }
        );
        resolve(existingItem);
      };
      getAllRequest.onerror = (event) => reject(event.target.error);
    });

    if (existingItem) {
      // Update existing item
      existingItem.quantity += quantity;
      resultUid = existingItem.uid;
      await new Promise((resolve, reject) => {
        const putRequest = store.put(existingItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (event) => reject(event.target.error);
      });
    } else {
      // Add new item
      const newUid = Date.now();
      const newItem = {
        product: product,
        selected_options: options,
        quantity: quantity,
        addedAt: Date.now(),
        taxAmount: taxAmount,
        uid: newUid // Add a unique identifier
      };
      resultUid = newUid;
      await new Promise((resolve, reject) => {
        const putRequest = store.put(newItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (event) => reject(event.target.error);
      });
    }

    // Commit transaction
    await tx.done;

    return resultUid;
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return false;
  }
};


export const getCartItems = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readonly");
    const store = tx.objectStore(CART_STORE);

    // Use getAll to retrieve all items in the cart
    const items = await new Promise((resolve, reject) => {
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = (event) => reject(event.target.error);
    });

    await tx.done;
    return items;
  } catch (error) {
    console.error("Failed to retrieve cart items:", error);
    return [];
  }
};

export const removeFromCart = async (cartItemUid) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    // Find and remove the specific item using its unique UID
    const itemToRemove = await new Promise((resolve, reject) => {
      const request = store.get(cartItemUid);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    if (itemToRemove) {
      if (itemToRemove.quantity > 1) {
        // Decrease quantity
        itemToRemove.quantity -= 1;
        const putRequest = store.put(itemToRemove);
        await new Promise((resolve) => {
          putRequest.onsuccess = () => resolve(true);
          putRequest.onerror = () => resolve(false);
        });
      } else {
        // Remove entire item if quantity is 1
        const deleteRequest = store.delete(cartItemUid);
        await new Promise((resolve) => {
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = () => resolve(false);
        });
      }
    } else {
      // Fallback for backward compatibility
      const getAllRequest = store.getAll();
      await new Promise((resolve) => {
        getAllRequest.onsuccess = () => {
          const item = getAllRequest.result.find(i => i.product.uid === cartItemUid);
          if (item) {
            if (item.quantity > 1) {
              item.quantity -= 1;
              store.put(item);
            } else {
              store.delete(item.uid);
            }
          }
          resolve();
        };
        getAllRequest.onerror = () => resolve();
      });
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to remove from cart:", error);
    return false;
  }
};

export const deleteFromCart = async (cartItemUid) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    // Try to delete directly by key (cartItemUid)
    const item = await new Promise((resolve) => {
      const req = store.get(cartItemUid);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (item) {
      await store.delete(cartItemUid);
    } else {
      // Fallback: search by product UID
      const getAllRequest = store.getAll();
      await new Promise((resolve) => {
        getAllRequest.onsuccess = () => {
          const itemToDelete = getAllRequest.result.find(i => i.product.uid === cartItemUid);
          if (itemToDelete) {
            store.delete(itemToDelete.uid);
          }
          resolve();
        };
        getAllRequest.onerror = () => resolve();
      });
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to delete item from cart:", error);
    return false;
  }
};


// Enhanced clear cart with confirmation
export const clearCart = async () => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    // Clear all items
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve(true);
      clearRequest.onerror = (event) => reject(false);
    });

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to clear cart:", error);
    return false;
  }
};

export const updateCartItemQuantity = async (cartItemUid, newQuantity) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    // Try to get by UID
    let item = await new Promise((resolve) => {
      const req = store.get(cartItemUid);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (item) {
      item.quantity = newQuantity;
      await store.put(item);
    } else {
      // Fallback logic
      console.warn(`Cart item with UID ${cartItemUid} not found.`);
      return false;
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to update cart item quantity:", error);
    return false;
  }
};


export const saveViewMode = async (mode) => {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(VIEW_STORE, "readwrite");
    const store = tx.objectStore(VIEW_STORE);
    await store.put({ id: 1, mode });
    await tx.done;
  } catch (error) {
    console.error("Failed to save view mode:", error);
  }
};

// Get View Mode from IndexedDB
export const getViewMode = async () => {
  if (typeof window === "undefined") return "category"; // Default mode

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIEW_STORE, "readonly");
      const store = tx.objectStore(VIEW_STORE);
      const request = store.get(1);
      request.onsuccess = () => resolve(request.result?.mode || "category");
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error("Failed to fetch view mode:", error);
    return "cards";
  }
};

export const saveOrder = async (orderData) => {
  if (!orderData?.items || orderData.items.length === 0) return;

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_STORE], "readwrite");
    const store = transaction.objectStore(ORDERS_STORE);

    const request = store.add(orderData);

    request.onsuccess = () => resolve(orderData);
    request.onerror = (event) => reject(event.target.error);
  });
};


export const getOrders = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_STORE], "readonly");
    const store = transaction.objectStore(ORDERS_STORE);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const clearOrders = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_STORE], "readwrite");
    const store = transaction.objectStore(ORDERS_STORE);

    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};


export const savePDFSettings = async (settings) => {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, "readwrite");
  const store = tx.objectStore(SETTINGS_STORE);
  await store.put({ id: "default", ...settings });
  await tx.done;
};

export const getPDFSettings = async () => {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, "readonly");
  const store = tx.objectStore(SETTINGS_STORE);

  const data = await new Promise((resolve, reject) => {
    const request = store.get("default");

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });

  await tx.done;
  return data || null;
};

export const updateWholeProduct = async (cartItemUid, newItem) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(CART_STORE, "readwrite");
    const store = tx.objectStore(CART_STORE);

    // Get by UID
    const item = await new Promise((resolve) => {
      const req = store.get(cartItemUid);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (item) {
      // Replace
      // Ensure we keep the same UID
      newItem.uid = cartItemUid;
      await store.put(newItem);
    } else {
      // Fallback: try finding by product UID if cartItemUid is not found (and might be product UID)
      const getAllRequest = store.getAll();
      await new Promise((resolve) => {
        getAllRequest.onsuccess = () => {
          const existingItem = getAllRequest.result.find(i => i.product.uid === cartItemUid);
          if (existingItem) {
            newItem.uid = existingItem.uid; // Keep original UID
            store.put(newItem);
          }
          resolve();
        };
        getAllRequest.onerror = () => resolve();
      });
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to replace cart item:", error);
    return false;
  }
};

//For Orders Page
export const saveOrders = async (order) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_PAGE], "readwrite");
    const store = transaction.objectStore(ORDERS_PAGE);

    const request = store.put(order);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
    transaction.onerror = (event) => reject(event.target.error);
  });
};



export const getAllOrders = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_PAGE], "readonly");
    const store = transaction.objectStore(ORDERS_PAGE);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result || []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const deleteAllOrders = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_PAGE], "readwrite");
    const store = transaction.objectStore(ORDERS_PAGE);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
    transaction.onerror = (event) => reject(event.target.error);
  });
};


export const saveMultipleOrders = async (orders = []) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ORDERS_PAGE], "readwrite");
    const store = transaction.objectStore(ORDERS_PAGE);

    orders.forEach((order) => {
      store.put(order); // again, 'put' ensures no duplication or errors
    });

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = (event) => reject(event.target.error);
  });
};

export const addItemsToSuspend = async (cartItems) => {
  if (typeof window === "undefined") return false;

  try {
    const db = await openDB();
    const tx = db.transaction(ON_HOLD_CARTS_STORE, "readwrite");
    const store = tx.objectStore(ON_HOLD_CARTS_STORE);

    // Ensure cartItems is always an array
    let itemsArray;
    if (Array.isArray(cartItems)) {
      itemsArray = cartItems;
    } else if (cartItems && typeof cartItems === 'object') {
      // If it's a single item object, wrap it in an array
      itemsArray = [cartItems];
    } else {
      // If it's null, undefined, or invalid, use empty array
      itemsArray = [];
    }

    const onHoldCart = {
      id: Date.now(), // or let autoIncrement handle it
      items: itemsArray,
      createdAt: new Date().toISOString(),
      note: `On-hold cart at ${new Date().toLocaleString()}`
    };

    await new Promise((resolve, reject) => {
      const request = store.add(onHoldCart);
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });

    await tx.done;
    return true;
  } catch (error) {
    console.error("Failed to suspend cart:", error);
    return false;
  }
};


export const getAllOnHoldCarts = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ON_HOLD_CARTS_STORE], "readonly");
    const store = transaction.objectStore(ON_HOLD_CARTS_STORE);

    const request = store.getAll();

    request.onsuccess = (event) => resolve(event.target.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const deleteSuspendedItem = async (uid) => {
  const db = await openDB();
  const tx = db.transaction(ON_HOLD_CARTS_STORE, "readwrite");
  const store = tx.objectStore(ON_HOLD_CARTS_STORE);
  await store.delete(uid);
  await tx.done;
};

export const saveCustomer = async (customer) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOMER_STORE], "readwrite");
    const store = transaction.objectStore(CUSTOMER_STORE);

    const request = store.put(customer); // Uses `keyPath: "id"` or your unique field

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
    transaction.onerror = (event) => reject(event.target.error);
  });
};

export const getAllCustomers = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOMER_STORE], "readonly");
    const store = transaction.objectStore(CUSTOMER_STORE);

    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result || []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const searchCustomers = async (query) => {
  const db = await openDB();
  const lowerQuery = query.toLowerCase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOMER_STORE], "readonly");
    const store = transaction.objectStore(CUSTOMER_STORE);
    const results = [];

    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const customer = cursor.value;
        if (
          customer.id?.toString().includes(lowerQuery) ||
          customer.name?.toLowerCase().includes(lowerQuery) ||
          customer.email?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(customer);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    cursorRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const saveEmployee = async (employee) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EMPLOYEE_STORE], "readwrite");
    const store = transaction.objectStore(EMPLOYEE_STORE);

    const request = store.put(employee); // Will insert or update by id

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
    transaction.onerror = (event) => reject(event.target.error);
  });
};

export const getAllEmployees = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EMPLOYEE_STORE], "readonly");
    const store = transaction.objectStore(EMPLOYEE_STORE);

    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result || []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const searchEmployees = async (query) => {
  const db = await openDB();
  const lowerQuery = query.toLowerCase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EMPLOYEE_STORE], "readonly");
    const store = transaction.objectStore(EMPLOYEE_STORE);
    const results = [];

    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const emp = cursor.value;
        if (
          emp.id?.toString().includes(lowerQuery) ||
          emp.firstname?.toLowerCase().includes(lowerQuery) ||
          emp.lastname?.toLowerCase().includes(lowerQuery) ||
          emp.email?.toLowerCase().includes(lowerQuery) ||
          emp.username?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(emp);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    cursorRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

