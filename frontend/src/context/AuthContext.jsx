// // import { createContext, useContext, useState, useEffect } from 'react';

// // const AuthContext = createContext(null);

// // export const AuthProvider = ({ children }) => {
// //     const [isLoggedIn, setIsLoggedIn] = useState(false);
// //     const [user, setUser] = useState(null);
// //     const [loading, setLoading] = useState(true);

// //     // Check if user is logged in on mount
// //     useEffect(() => {
// //         const checkAuth = async () => {
// //             const token = localStorage.getItem('token');
// //             if (token) {
// //                 try {
// //                     const response = await fetch('http://localhost:8000/wallet/profile/', {
// //                         headers: {
// //                             'Authorization': `Bearer ${token}`
// //                         }
// //                     });
// //                     if (response.ok) {
// //                         const userData = await response.json();
// //                         console.log(userData)
// //                         setIsLoggedIn(true);
// //                         setUser(userData);
// //                     } else {
// //                         // Token invalid/expired
// //                         localStorage.removeItem('token');
// //                         setIsLoggedIn(false);
// //                         setUser(null);
// //                     }
// //                 } catch (error) {
// //                     console.error('Auth verification failed:', error);
// //                     localStorage.removeItem('token');
// //                     setIsLoggedIn(false);
// //                     setUser(null);
// //                 }
// //             }
// //             setLoading(false);
// //         };

// //         checkAuth();
// //     }, []);

// //     const login = (token, userData) => {
// //         localStorage.setItem('token', token);
// //         setIsLoggedIn(true);
// //         setUser(userData);
// //     };

// //     const logout = () => {
// //         localStorage.removeItem('token');
// //         setIsLoggedIn(false);
// //         setUser(null);
// //     };

// //     return (
// //         <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
// //             {children}
// //         </AuthContext.Provider>
// //     );
// // };

// // export const useAuth = () => {
// //     const context = useContext(AuthContext);
// //     if (!context) {
// //         throw new Error('useAuth must be used within AuthProvider');
// //     }
// //     console.log(context)
// //     return context;
// // };


// import { createContext, useContext, useEffect, useState } from "react";
// import { getProfile } from "../services/auth";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // 🔁 Run once on app load
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       setIsLoggedIn(true);
//       loadProfile();
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   // 🔽 Load user profile (includes is_staff)
//   const loadProfile = async () => {
//     try {
//       const profile = await getProfile();

//       // 👇 STORE ADMIN FLAGS HERE
//       setUser({
//         id: profile.id,
//         username: profile.username,
//         email: profile.email,
//         is_staff: profile.is_staff,
//         is_superuser: profile.is_superuser,
//       });
//     } catch (error) {
//       console.error("Profile load failed:", error);
//       logout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Login
//   const login = (accessToken) => {
//     localStorage.setItem("access", accessToken);
//     setIsLoggedIn(true);
//     loadProfile(); // fetch is_staff immediately
//   };

//   // ✅ Logout
//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("refresh");
//     setIsLoggedIn(false);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         isLoggedIn,
//         user,
//         login,
//         logout,
//         loading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return context;
// };


import { createContext, useContext, useEffect, useState } from "react";
import { getProfile } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Run once on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // 🔽 Load profile (contains is_staff)
  const loadProfile = async () => {
    try {
      const profile = await getProfile();

      setUser({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        is_staff: profile.is_staff,
        is_superuser: profile.is_superuser,
      });
    } catch (error) {
      console.error("Profile load failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login (store token already done in auth.js)
  const login = () => {
    setIsLoggedIn(true);
    loadProfile();
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
