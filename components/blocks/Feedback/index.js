"use client";

import React, { useState } from "react";
import style from "./feedback.module.scss";
import Image from "next/image";
import { RatingStar } from "@/components/shared/RatingStar";
import SimpleAlertModal from "@/components/global/alertModal";

export default function Feedback({ ordersResponse, submitFeedback }) {
  const [comment, setComment] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [productRatings, setProductRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ loading state

  const [state, setState] = useState(false)
  const prod_arr = ordersResponse?.data?.items?.map((item) => {
    return {
      id: item?.item_id,
      name: item?.product_name,
      image: item?.image_url,
      alt: item?.product_name,
      price: item?.item_price,
    };
  });

  const handleProductRatingChange = (productIndex, rating) => {
    setProductRatings((prev) => ({
      ...prev,
      [productIndex]: rating,
    }));
  };

  const handleSubmit = async () => {
    const reviewData = {
      reviewData: {
        order_id: ordersResponse?.data?.increment_id,
        order_review: comment,
        order_rating: overallRating,
        products: prod_arr
          .map((product, index) => ({
            product_id: product.id,
            product_rating: productRatings[index] || 0,
          }))
          .filter((product) => product.product_rating > 0),
      },
    };

    try {
      setIsSubmitting(true); // ✅ start loading
      const response = await submitFeedback(reviewData);
      if (response) {
        setState(true)
        setComment("");
        setOverallRating(0);
        setProductRatings({});
      } else {
        alert("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);

    } finally {
      setIsSubmitting(false); // ✅ stop loading
    }
  };

  return (
    <div className={style.page_detail}>
      <div className={style.feedback_container}>
        <h2>Feedback Form</h2>
        <div className={style.feedback_section}>
          {prod_arr.map((item, index) => (
            <div className={style.feedback_card} key={index}>
              <div className={style.feedback_card_content}>
                <Image
                  src={item?.image}
                  width={100}
                  height={67}
                  alt={item.alt}
                />
                <div className={style.feedback_card_details}>
                  <div className={style.feedback_card_info}>
                    <p>{item.name}</p>
                    <p className={style.feedback_card_price}>${item?.price}</p>
                  </div>
                  <div className={style.feedback_card_rating}>
                    <p>Rating : (1-5 Stars)</p>
                    <RatingStar
                      rating={productRatings[index] || 0}
                      onRatingChange={(rating) =>
                        handleProductRatingChange(index, rating)
                      }
                      isClickable={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={style.feedback_overall_rating}>
          <p>Overall Satisfaction</p>
          <RatingStar
            rating={overallRating}
            onRatingChange={setOverallRating}
            isClickable={true}
          />
        </div>

        <div className={style.feedback_comment_section}>
          <p>Comments</p>
          <textarea
            name="text"
            id="text"
            rows="5"
            className={style.comment_input}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        <button
          className={style.button}
          onClick={handleSubmit}
          disabled={isSubmitting} // ✅ disable button while loading
        >
          {isSubmitting ? "Submitting..." : "Submit"} {/* ✅ dynamic text */}
        </button>
      </div>
       {state && (
              <SimpleAlertModal
                isOpen={state}
                onClose={() => setState(false)}
                title="Review Submitted"
                message="Your Review has been recorded. Thanks."
              />
            )}
    </div>
  );
}
