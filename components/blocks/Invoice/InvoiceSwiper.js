"use client"

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import Image from 'next/image';

import { Autoplay, Pagination } from 'swiper/modules';

export default function InvoiceSwiper({slide, style}) {
  return (
    <>
      <Swiper pagination={true} modules={[Pagination, Autoplay]} 
         autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        loop
        className="mySwiper">
        {slide?.map((item, index)=>(
            <SwiperSlide key={index}>
<div style={{ position: "relative", width: "100%", height: "300px" }}>
             <Image src={item?.image_url} alt='banner' fill style={{objectFit:"cover",}}/>
             <div className={style.overlay}></div>
             </div>
             <div className={style.banner_text}>
               <p className={style.banner_desc}>{item?.detail}</p>
               <p className={style.banner_title}>{item?.title}</p>
             </div>
            </SwiperSlide>

        ))}
      </Swiper>
    </>
  );
}
