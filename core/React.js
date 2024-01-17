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
      if (typeof child == "string" || typeof child == "number") {
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
let wipRoot = null;
let currentRoot = null;

function renderV2(vDom, container) {
  wipRoot = {
    type: DomType.Element,
    tag: "div",
    dom: container,
    children: [vDom],
  };
  nextUnitOfWork = wipRoot;
}

function createDom(vDom) {
  const dom =
    vDom.type == DomType.Text
      ? document.createTextNode(vDom.props.nodeValue)
      : document.createElement(vDom.tag);
  return dom;
}

function updateProps(dom, nextProps, prevProps) {
  // 1. old有，new无，删除节点
  Object.keys(prevProps).forEach((key) => {
    if (key !== "children") {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  });
  // 2. old无，new有，添加节点
  // 3. old有，new有，修改节点
  Object.keys(nextProps).forEach((key) => {
    if (key !== "children") {
      if (nextProps[key] !== prevProps[key]) {
        if (/^on/.test(key)) {
          const eventType = key.substring(2).toLocaleLowerCase();
          dom.removeEventListener(eventType, prevProps[key]);
          dom.addEventListener(eventType, nextProps[key]);
        } else {
          dom[key] = nextProps[key];
        }
      }
    }
  });
}

function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(wipRoot);
  }

  requestIdleCallback(workLoop);
}

function commitRoot(fiber) {
  commitWork(fiber.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.effectTag === "update") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  } else if (fiber.effectTag === "placement") {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
  }

  commitWork(fiber.child);

  commitWork(fiber.sibling);
}

function reconcileChildren(fiber, children) {
  // const children = fiber.children || [];

  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    const isSameType = oldFiber && oldFiber.type === child.type;
    let newFiber;
    if (isSameType) {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "update",
        alternate: oldFiber,
        tag: child.tag,
        children: child.children,
      };
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        effectTag: "placement",
        tag: child.tag,
        children: child.children,
      };
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateHostText(fiber) {
  const children = fiber.children || [];
  reconcileChildren(fiber, children);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";

  if (!isFunctionComponent) {
    if (!fiber.dom) {
      const dom = createDom(fiber);
      fiber.dom = dom;
      updateProps(dom, fiber.props);
      // fiber.parent.dom.append(dom);
    }
  }

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostText(fiber);
  }

  // initChildren(fiber);

  // return fiber.child || fiber.sibling || fiber.parent?.sibling;

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

requestIdleCallback(workLoop);

const React = {
  createElement,
  render: renderV2,
};

export default React;
