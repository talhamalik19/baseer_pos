import { useState } from "react";
import ProductOptionsModal from "./ProductOptionsModal";

const TableView = ({ item, setIsOpen, handleAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    const handleConfirm = (item, options) => {
      handleAddToCart(item, options, parseInt(quantity) );
    };
  
    const handleAddProduct = (item) =>{
      if(item?.__typename === "SimpleProduct"){
        handleAddToCart(item, [], parseInt(quantity))
      } else {
        setIsModalOpen(true)
      }
    }

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
            />
    </tr>
  );
};

export default TableView;