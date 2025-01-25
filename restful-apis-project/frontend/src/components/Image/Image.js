import React from "react";

import "./Image.css";

function Image(props) {
  return (
    <div
      className="image"
      style={{
        backgroundImage: `url('http://localhost:8080/${props.imageUrl}')`,
        // backgroundImage: `url(${props.imageUrl})`,
        backgroundSize: props.contain ? "contain" : "cover",
        backgroundPosition: props.left ? "left" : "center",
      }}
    />
  );
}

export default Image;
