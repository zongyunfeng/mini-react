import { DomType } from "./DomType.js";

function createTextNode(text) {
  return {
    type: DomType.Text,
    props: {
      nodeValue: text,
    },
  };
}

function createElement(tag, props, ...children) {
  return {
    type: DomType.Element,
    tag: tag,
    props: {
      props: props,
      children: children.map((child) => {
        if (typeof child == "string") {
          return createTextNode(child);
        } else {
          return child;
        }
      }),
    },
  };
}

function render(el, container) {
  const dom =
    el.type == DomType.Text
      ? document.createTextNode(el.props.nodeValue)
      : document.createElement(el.tag);

  Object.keys(el.props).forEach((key) => {
    if (key !== "children") {
      dom[key]= el.props[key];
    }
  });

  if (el.props.children) {
    el.props.children.forEach((child) => {
      render(child, dom);
    });
  }

  container.append(dom);
}

const React = {
  createElement,
  render,
};

export default React;
