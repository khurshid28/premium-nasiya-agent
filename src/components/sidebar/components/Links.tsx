/* eslint-disable */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "components/icons/DashIcon";
import ErrorBoundary from "components/ErrorBoundary";

// Sidebar links renderer
export const SidebarLinks = (props: { routes: RoutesType[]; onClose?: React.MouseEventHandler<HTMLSpanElement> }): JSX.Element => {
  const { routes, onClose } = props;
  const location = useLocation();

  const activeRoute = (routeName: string) => {
    return location.pathname.includes(routeName);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1280 && onClose) {
      onClose({} as React.MouseEvent<HTMLSpanElement>);
    }
  };

  const createLinks = (routes: RoutesType[]) => {
    return routes.map((route, index) => {
      // Skip hidden routes (e.g., Profile removed from sidebar)
      // @ts-ignore allow optional hidden flag on route objects
      if ((route as any).hidden) return null;
      if (route.layout === "/admin") {
        return (
          <Link key={index} to={route.layout + "/" + route.path} onClick={handleLinkClick}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li className="my-[3px] flex cursor-pointer items-center px-6" key={index}>
                {/* modest icon tile */}
                <span
                  className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md transition-colors duration-150 ${
                    activeRoute(route.path)
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-700 dark:text-white/80 dark:hover:bg-navy-600"
                  }`}
                >
                  {/* Render provided icon element directly to avoid manipulating library internals */}
                  <ErrorBoundary
                    fallback={
                      <span className="h-5 w-5 inline-flex items-center justify-center">
                        <DashIcon />
                      </span>
                    }
                  >
                    {route.icon && React.isValidElement(route.icon) ? (
                      route.icon
                    ) : (
                      <span className="h-5 w-5 inline-flex items-center justify-center">
                        <DashIcon />
                      </span>
                    )}
                  </ErrorBoundary>
                </span>

                <p
                  className={`ml-3 flex items-center leading-5 ${
                    activeRoute(route.path)
                      ? "font-medium text-navy-700 dark:text-white"
                      : "font-medium text-gray-600 dark:text-white/90"
                  }`}
                >
                  {route.name}
                </p>
              </li>
              {activeRoute(route.path) ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
              ) : null}
            </div>
          </Link>
        );
      }
      return null;
    });
  };

  return <>{createLinks(routes)}</>;
};

export default SidebarLinks;
