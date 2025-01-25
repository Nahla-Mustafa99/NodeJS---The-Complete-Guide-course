import React from "react";
import { useParams } from "react-router-dom";
export function withRouter(Children) {
  return (props) => {
    const params = useParams();
    return <Children {...props} params={params} />;
  };
}
export default withRouter;
