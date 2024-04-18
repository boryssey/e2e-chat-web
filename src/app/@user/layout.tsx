const UserLayout = ({
  children,
  chat,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
}) => {
  console.log("user layout");
  return <main>{children}</main>;
};

export default UserLayout;
