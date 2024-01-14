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
    props,
    children: children.map((child) => {
      if (typeof child == "string") {
        return createTextNode(child);
      } else {
        return child;
      }
    }),
  };
}

function render(el, container) {
  const dom =
    el.type == DomType.Text
      ? document.createTextNode(el.props.nodeValue)
      : document.createElement(el.tag);

  Object.keys(el.props).forEach((key) => {
    if (key !== "children") {
      dom[key] = el.props[key];
    }
  });

  if (el.children) {
    el.children.forEach((child) => {
      render(child, dom);
    });
  }

  container.append(dom);
}

let nextUnitOfWork = null;

function renderV2(vDom, container) {
  nextUnitOfWork = {
    type: DomType.Element,
    tag: "div",
    dom: container,
    children: [vDom],
  };
}

function createDom(vDom) {
  const dom =
    vDom.type == DomType.Text
      ? document.createTextNode(vDom.props.nodeValue)
      : document.createElement(vDom.tag);
  return dom;
}

function updateProps(dom, props) {
  Object.keys(props).forEach((key) => {
    // if (key !== "children") {
    dom[key] = props[key];
    // }
  });
}

function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  requestIdleCallback(workLoop);
}

function initChildren(fiber) {
  const children = fiber.children || [];

  let prevChild = null;
  children.forEach((child, index) => {
    const newFiber = {
      dom: null,
      type: child.type,
      tag: child.tag,
      parent: fiber,
      sibling: null,
      props: child.props,
      child: null,
      children: child.children,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    const dom = createDom(fiber);
    fiber.dom = dom;
    updateProps(dom, fiber.props);
    fiber.parent.dom.append(dom);
  }

  initChildren(fiber);

  return fiber.child || fiber.sibling || fiber.parent?.sibling;
}

requestIdleCallback(workLoop);

const React = {
  createElement,
  render: renderV2,
};

export default React;
