import { useState } from "react";
import ProductOptionsModal from "./ProductOptionsModal";
import { getCartItems, updateCartItemQuantity, updateWholeProduct, deleteFromCart } from "@/lib/indexedDB";

const TableView = ({ item, setIsOpen, handleAddToCart, allProducts }) => {
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingCartItem, setExistingCartItem] = useState(null);
  const [existingCartItems, setExistingCartItems] = useState([]);

  const handleConfirm = async ({ product, childSku, options, quantity }) => {
    const skuToUse = childSku || product.sku;
    const item = { ...product, sku: skuToUse };

    // Check if this exact variant+options combination already exists
    const cartItemsList = await getCartItems();
    const exactMatch = cartItemsList.find(
      cartItem => {
        const basicMatch = cartItem.product.uid === item.uid &&
          JSON.stringify(cartItem.selected_options) === JSON.stringify(options);

        if (!basicMatch) return false;

        // STRICT CHECK: Verify parent product ID matches if available
        if (item.product_id) {
          if (cartItem.product.product_id) {
            return item.product_id === cartItem.product.product_id;
          }
          // If incoming has ID but existing doesn't, assume different to be safe
          return false;
        }

        return true;
      }
    );

    if (exactMatch) {
      // Replace quantity instead of incrementing
      await updateCartItemQuantity(exactMatch.product.uid, exactMatch.addedAt, quantity);
    } else {
      // Add as new item
      handleAddToCart(item, options, quantity);
    }

    setIsModalOpen(false);
  };

  const handleAddProduct = async (item) => {
    if (item?.__typename === "SimpleProduct") {
      handleAddToCart(item, [], parseInt(quantity));
    } else {
      // Find all variants of this product in cart
      const cartItemsList = await getCartItems();
      const variantsInCart = cartItemsList.filter(cartItem => {
        const cartProd = cartItem.product;

        if (item.__typename === "ConfigurableProduct") {
          // Check if it's a variant of THIS product
          const isVariant = item.variants?.some(variant =>
            variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
          );

          if (!isVariant) return false;

          // STRICT CHECK: Verify parent product ID matches
          if (cartProd.product_id && item.id && cartProd.product_id === item.id) {
            return true;
          }

          // Fallback for older items without product_id
          if (!cartProd.product_id) {
            return true;
          }

          return false;
        }

        return cartProd.uid === item.uid || cartProd.id === item.id;
      });

      setExistingCartItems(variantsInCart);
      setExistingCartItem(null);
      setIsModalOpen(true);
    }
  }

  const handleDeleteCartItem = async (cartItem) => {
    await deleteFromCart(cartItem.product.uid);
    const updatedCart = await getCartItems();

    // Update the existing cart items list in modal
    // Update the existing cart items list in modal
    const variantsInCart = updatedCart.filter(cartItem => {
      const cartProd = cartItem.product;

      if (item.__typename === "ConfigurableProduct") {
        // Check if it's a variant of THIS product
        const isVariant = item.variants?.some(variant =>
          variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
        );

        if (!isVariant) return false;

        // STRICT CHECK: Verify parent product ID matches
        if (cartProd.product_id && item.id && cartProd.product_id === item.id) {
          return true;
        }

        // Fallback for older items without product_id
        if (!cartProd.product_id) {
          return true;
        }

        return false;
      }

      return cartProd.uid === item.uid || cartProd.id === item.id;
    });

    setExistingCartItems(variantsInCart);
  };

  return (
    <tr>
      <td>{item?.sku}</td>
      <td>{item.name}</td>
      <td>{item?.price?.regularPrice?.amount?.value}</td>
      <td>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="qty_input"
        />
      </td>
      <td>
        <button onClick={() => handleAddProduct(item)}>Add to Cart</button>
      </td>
      <ProductOptionsModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        allProducts={allProducts}
        existingCartItem={existingCartItem}
        existingCartItems={existingCartItems}
        onDeleteCartItem={handleDeleteCartItem}
      />
    </tr>
  );
};

export default TableView;