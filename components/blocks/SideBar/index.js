import React from "react";
import SidebarClient from "./SidebarClient";
import LanguageProvider from "@/components/global/LanguageProvider";
import CurrencyProvider from "@/components/global/CurrencyProvider";

export default async function SideBar() {
  const language = await LanguageProvider();
  const serverLanguage = await language?.csvTranslations;
  const nav = [
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 2H2.66667C2.29848 2 2 2.29848 2 2.66667V7.33333C2 7.70152 2.29848 8 2.66667 8H6C6.36819 8 6.66667 7.70152 6.66667 7.33333V2.66667C6.66667 2.29848 6.36819 2 6 2Z"
            stroke="#45556C"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13.333 2H9.99967C9.63148 2 9.33301 2.29848 9.33301 2.66667V4.66667C9.33301 5.03486 9.63148 5.33333 9.99967 5.33333H13.333C13.7012 5.33333 13.9997 5.03486 13.9997 4.66667V2.66667C13.9997 2.29848 13.7012 2 13.333 2Z"
            stroke="#45556C"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13.333 8H9.99967C9.63148 8 9.33301 8.29848 9.33301 8.66667V13.3333C9.33301 13.7015 9.63148 14 9.99967 14H13.333C13.7012 14 13.9997 13.7015 13.9997 13.3333V8.66667C13.9997 8.29848 13.7012 8 13.333 8Z"
            stroke="#45556C"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6 10.6667H2.66667C2.29848 10.6667 2 10.9651 2 11.3333V13.3333C2 13.7015 2.29848 14 2.66667 14H6C6.36819 14 6.66667 13.7015 6.66667 13.3333V11.3333C6.66667 10.9651 6.36819 10.6667 6 10.6667Z"
            stroke="#45556C"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.dashboard ?? "Dashboard",
      field_redirect: "/dashboard",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_832_1827)">
            <path
              d="M5.33317 14.6666C5.70136 14.6666 5.99984 14.3681 5.99984 13.9999C5.99984 13.6317 5.70136 13.3333 5.33317 13.3333C4.96498 13.3333 4.6665 13.6317 4.6665 13.9999C4.6665 14.3681 4.96498 14.6666 5.33317 14.6666Z"
              stroke="#CAD5E2"
              stroke-width="1.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12.6667 14.6666C13.0349 14.6666 13.3333 14.3681 13.3333 13.9999C13.3333 13.6317 13.0349 13.3333 12.6667 13.3333C12.2985 13.3333 12 13.6317 12 13.9999C12 14.3681 12.2985 14.6666 12.6667 14.6666Z"
              stroke="#CAD5E2"
              stroke-width="1.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M1.3667 1.3667H2.70003L4.47337 9.6467C4.53842 9.94994 4.70715 10.221 4.95051 10.4133C5.19387 10.6055 5.49664 10.7069 5.8067 10.7H12.3267C12.6301 10.6995 12.9244 10.5956 13.1607 10.4053C13.3971 10.215 13.5615 9.94972 13.6267 9.65336L14.7267 4.70003H3.41337"
              stroke="#CAD5E2"
              stroke-width="1.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_832_1827">
              <rect width="26" height="26" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      field_text: serverLanguage?.sales ?? "Sales",
      field_redirect: "/sale",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_832_1847)">
            <path
              d="M8 4V8L10.6667 9.33333"
              stroke="#CAD5E2"
              stroke-width="1.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8.00016 14.6666C11.6821 14.6666 14.6668 11.6818 14.6668 7.99992C14.6668 4.31802 11.6821 1.33325 8.00016 1.33325C4.31826 1.33325 1.3335 4.31802 1.3335 7.99992C1.3335 11.6818 4.31826 14.6666 8.00016 14.6666Z"
              stroke="#CAD5E2"
              stroke-width="1.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_832_1847">
              <rect width="26" height="26" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      field_text: serverLanguage?.on_hold ?? "Suspend",
      field_redirect: "/suspend",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.6668 6.66675C10.6668 7.37399 10.3859 8.05227 9.88578 8.55237C9.38568 9.05246 8.70741 9.33341 8.00016 9.33341C7.29292 9.33341 6.61464 9.05246 6.11454 8.55237C5.61445 8.05227 5.3335 7.37399 5.3335 6.66675"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2.06885 4.02271H13.9315"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2.26667 3.64459C2.09357 3.87538 2 4.15609 2 4.44458V13.3333C2 13.6869 2.14048 14.026 2.39052 14.2761C2.64057 14.5261 2.97971 14.6666 3.33333 14.6666H12.6667C13.0203 14.6666 13.3594 14.5261 13.6095 14.2761C13.8595 14.026 14 13.6869 14 13.3333V4.44458C14 4.15609 13.9064 3.87538 13.7333 3.64459L12.4 1.86659C12.2758 1.70099 12.1148 1.56659 11.9296 1.47402C11.7445 1.38145 11.5403 1.33325 11.3333 1.33325H4.66667C4.45967 1.33325 4.25552 1.38145 4.07038 1.47402C3.88524 1.56659 3.7242 1.70099 3.6 1.86659L2.26667 3.64459Z"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.catalog ?? "Catalog",
      field_redirect: "/product",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.33333 14.4867C7.53603 14.6037 7.76595 14.6653 8 14.6653C8.23405 14.6653 8.46397 14.6037 8.66667 14.4867L13.3333 11.82C13.5358 11.7031 13.704 11.535 13.821 11.3326C13.938 11.1301 13.9998 10.9005 14 10.6667V5.33335C13.9998 5.09953 13.938 4.86989 13.821 4.66746C13.704 4.46503 13.5358 4.29692 13.3333 4.18002L8.66667 1.51335C8.46397 1.39633 8.23405 1.33472 8 1.33472C7.76595 1.33472 7.53603 1.39633 7.33333 1.51335L2.66667 4.18002C2.46418 4.29692 2.29599 4.46503 2.17897 4.66746C2.06196 4.86989 2.00024 5.09953 2 5.33335V10.6667C2.00024 10.9005 2.06196 11.1301 2.17897 11.3326C2.29599 11.535 2.46418 11.7031 2.66667 11.82L7.33333 14.4867Z"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 14.6667V8"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2.19336 4.66675L8.00003 8.00008L13.8067 4.66675"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5 2.84668L11 6.28001"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.orders ?? "Orders",
      field_redirect: "/order",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.6666 14V12.6667C10.6666 11.9594 10.3856 11.2811 9.88554 10.781C9.38544 10.281 8.70716 10 7.99992 10H3.99992C3.29267 10 2.6144 10.281 2.1143 10.781C1.6142 11.2811 1.33325 11.9594 1.33325 12.6667V14"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10.6667 2.08545C11.2386 2.2337 11.745 2.56763 12.1065 3.03482C12.4681 3.50202 12.6642 4.07604 12.6642 4.66678C12.6642 5.25752 12.4681 5.83154 12.1065 6.29874C11.745 6.76594 11.2386 7.09987 10.6667 7.24812"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14.6667 14V12.6667C14.6663 12.0758 14.4697 11.5019 14.1077 11.0349C13.7457 10.5679 13.2388 10.2344 12.6667 10.0867"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5.99992 7.33333C7.47268 7.33333 8.66659 6.13943 8.66659 4.66667C8.66659 3.19391 7.47268 2 5.99992 2C4.52716 2 3.33325 3.19391 3.33325 4.66667C3.33325 6.13943 4.52716 7.33333 5.99992 7.33333Z"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.employees ?? "Employees",
      field_redirect: "/employee",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H14"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 11.3333V6"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8.66699 11.3333V3.33334"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5.33301 11.3333V9.33334"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.report ?? "Report",
      field_redirect: "/report",
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.44754 2.75735C6.48427 2.37091 6.66376 2.01205 6.95094 1.75087C7.23812 1.4897 7.61235 1.34497 8.00054 1.34497C8.38872 1.34497 8.76296 1.4897 9.05014 1.75087C9.33732 2.01205 9.5168 2.37091 9.55354 2.75735C9.57561 3.00699 9.65751 3.24763 9.79229 3.45891C9.92707 3.67019 10.1108 3.84589 10.3278 3.97114C10.5449 4.09638 10.789 4.16749 11.0393 4.17843C11.2897 4.18938 11.539 4.13984 11.7662 4.03402C12.1189 3.87387 12.5187 3.8507 12.8875 3.96901C13.2564 4.08732 13.5681 4.33865 13.7619 4.67409C13.9557 5.00953 14.0177 5.40507 13.936 5.78373C13.8542 6.1624 13.6345 6.4971 13.3195 6.72269C13.1145 6.86658 12.9471 7.05776 12.8315 7.28004C12.7159 7.50231 12.6556 7.74916 12.6556 7.99969C12.6556 8.25021 12.7159 8.49706 12.8315 8.71934C12.9471 8.94161 13.1145 9.13279 13.3195 9.27669C13.6345 9.50228 13.8542 9.83697 13.936 10.2156C14.0177 10.5943 13.9557 10.9898 13.7619 11.3253C13.5681 11.6607 13.2564 11.9121 12.8875 12.0304C12.5187 12.1487 12.1189 12.1255 11.7662 11.9654C11.539 11.8595 11.2897 11.81 11.0393 11.8209C10.789 11.8319 10.5449 11.903 10.3278 12.0282C10.1108 12.1535 9.92707 12.3292 9.79229 12.5405C9.65751 12.7517 9.57561 12.9924 9.55354 13.242C9.5168 13.6285 9.33732 13.9873 9.05014 14.2485C8.76296 14.5097 8.38872 14.6544 8.00054 14.6544C7.61235 14.6544 7.23812 14.5097 6.95094 14.2485C6.66376 13.9873 6.48427 13.6285 6.44754 13.242C6.4255 12.9923 6.3436 12.7516 6.20878 12.5402C6.07396 12.3288 5.89018 12.1531 5.67302 12.0278C5.45586 11.9026 5.21172 11.8315 4.96126 11.8206C4.7108 11.8097 4.4614 11.8594 4.2342 11.9654C3.88146 12.1255 3.48175 12.1487 3.11287 12.0304C2.74399 11.9121 2.43232 11.6607 2.23853 11.3253C2.04473 10.9898 1.98268 10.5943 2.06444 10.2156C2.14621 9.83697 2.36594 9.50228 2.68087 9.27669C2.88595 9.13279 3.05336 8.94161 3.16893 8.71934C3.2845 8.49706 3.34484 8.25021 3.34484 7.99969C3.34484 7.74916 3.2845 7.50231 3.16893 7.28004C3.05336 7.05776 2.88595 6.86658 2.68087 6.72269C2.36638 6.49698 2.14704 6.16242 2.06547 5.78401C1.9839 5.4056 2.04594 5.01038 2.23953 4.67516C2.43311 4.33994 2.74441 4.08867 3.11293 3.97018C3.48145 3.85169 3.88086 3.87444 4.23354 4.03402C4.46071 4.13984 4.71003 4.18938 4.9604 4.17843C5.21078 4.16749 5.45482 4.09638 5.67189 3.97114C5.88896 3.84589 6.07266 3.67019 6.20745 3.45891C6.34223 3.24763 6.42413 3.00699 6.4462 2.75735"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
            stroke="#CAD5E2"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.setting ?? "Settings",
      field_redirect: "/setting",
      children: [
        {
          field_text: serverLanguage?.account ?? "Account",
          field_redirect: "/setting",
        },
        {
          field_text: serverLanguage?.pos_configuration ?? "POS Configuration",
          field_redirect: "/customization",
        },
        {
          field_text: serverLanguage?.pos_information ?? "POS Information",
          field_redirect: "/manage-pos",
        },
      ],
    },
    {
      svg: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.6663 14V12.6667C10.6663 11.9594 10.3854 11.2811 9.88529 10.781C9.3852 10.281 8.70692 10 7.99967 10H3.99967C3.29243 10 2.61415 10.281 2.11406 10.781C1.61396 11.2811 1.33301 11.9594 1.33301 12.6667V14"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10.667 2.08533C11.2388 2.23357 11.7453 2.5675 12.1068 3.0347C12.4683 3.5019 12.6645 4.07592 12.6645 4.66666C12.6645 5.2574 12.4683 5.83142 12.1068 6.29862C11.7453 6.76582 11.2388 7.09975 10.667 7.24799"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14.667 14V12.6667C14.6666 12.0758 14.4699 11.5019 14.1079 11.0349C13.7459 10.5679 13.2391 10.2344 12.667 10.0867"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M5.99967 7.33333C7.47243 7.33333 8.66634 6.13943 8.66634 4.66667C8.66634 3.19391 7.47243 2 5.99967 2C4.52692 2 3.33301 3.19391 3.33301 4.66667C3.33301 6.13943 4.52692 7.33333 5.99967 7.33333Z"
            stroke="white"
            stroke-width="1.33333"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      field_text: serverLanguage?.customers ?? "Customers",
      field_redirect: "/customer",
    },
  ];
  const currency = await CurrencyProvider();
  return <SidebarClient nav={nav} language={language} currency={currency} />;
}
