export default function updateProductQuery(formData) {
  const inputFields = Object.entries(formData)
    .map(([key, value]) => {
      // Handle images array separately
      if (key === 'images' && Array.isArray(value)) {
        const imagesString = value.map(img => {
          return `{ name: "${img.name}", base64: "${img.base64}" }`;
        }).join(', ');
        return `images: [${imagesString}]`;
      }
      
      // Handle other fields
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join('\n    ');

  return `mutation {
  updateProductDetails(input: {
    ${inputFields}
  }) {
    message
  }
}`;
}