import React from "react";

import Button from "../../Button/Button";
// import Image from "../../Image/Image";
import "./Post.css";

function post(props) {
  return (
    <article className="post">
      <header className="post__header">
        <h3 className="post__meta">
          Posted by {props.author} on {props.date}
        </h3>
        <h1 className="post__title">{props.title}</h1>
      </header>
      {/* <div className="single-post__image">
        <Image contain imageUrl={props.img} />
      </div> */}
      <div className="post__content">{props.content}</div>
      <div className="post__actions">
        <Button mode="flat" link={props.id}>
          View
        </Button>
        {props.isAuthToChange && (
          <Button mode="flat" onClick={props.onStartEdit}>
            Edit
          </Button>
        )}
        {props.isAuthToChange && (
          <Button mode="flat" design="danger" onClick={props.onDelete}>
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}

export default post;
