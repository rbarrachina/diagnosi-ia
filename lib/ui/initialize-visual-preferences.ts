export function initializeVisualPreferences(): void {
  try {
    const storedTheme = window.localStorage.getItem("diagnosi-theme");
    const theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    const storedCentreSidebar = window.localStorage.getItem(
      "diagnosi-ia:centre-sidebar-expanded",
    );
    document.documentElement.dataset.centreSidebar =
      storedCentreSidebar === "false" ? "collapsed" : "expanded";

    const storedAdminSidebar = window.localStorage.getItem(
      "diagnosi-ia:admin-sidebar-expanded",
    );
    document.documentElement.dataset.adminSidebar =
      storedAdminSidebar === "false" ? "collapsed" : "expanded";
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    document.documentElement.dataset.centreSidebar = "expanded";
    document.documentElement.dataset.adminSidebar = "expanded";
  }
}
