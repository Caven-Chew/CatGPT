import styles from "./NavBar.module.css";

const NavBar = () => {
    return (
    <nav className={styles["navbar"]}>
        <img src="/logo.png" alt="Meow" className={styles["chat-icon"]} />

    </nav>
  );
};

export default NavBar;