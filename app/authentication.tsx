import { useAuthSession } from "@/providers/authctx";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AuthenticationPage() {
  const { signIn, createUser } = useAuthSession();

  const [isRegistering, setIsRegistering] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  // Registrerer ny bruker i Firebase
  const handleRegister = async () => {
    if (!userName || !password || !email) {
      Alert.alert("Error", "Please fill in username, email, and password.");
      return;
    }

    try {
      await createUser(email, password, userName);

      Alert.alert("Success", "User registered! You are now being logged in.");

      // Nullstiller felter
      setUserName("");
      setPassword("");
      setEmail("");

      // Går tilbake til login
      setIsRegistering(false);
    } catch (error) {
      Alert.alert(
        "Error",
        "Registration failed. Please check your email and password.",
      );
      console.log(error);
    }
  };

  // Logger inn med Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        "Error",
        "Login failed. Please check your email and password.",
      );
      console.log(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.mainContainer}>
          <Text style={styles.mainTitle}>PetTrackr</Text>
          <Text style={styles.title}>
            {isRegistering ? "Register" : "Sign in"}
          </Text>

          {/* BRUKERNAVN */}
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={userName}
                onChangeText={setUserName}
              />
            </View>
          )}

          {/* E-POST */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSORD */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* BYTTE MELLOM REGISTRERING/LOGIN */}
          <Pressable
            onPress={() => setIsRegistering(!isRegistering)}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.switchText}>
              {isRegistering
                ? "Already have an account? Sign in"
                : "No account? Sign up here"}
            </Text>
          </Pressable>

          {/* KNAPP */}
          <Pressable
            style={styles.mainButton}
            onPress={isRegistering ? handleRegister : handleLogin}
          >
            <Text style={styles.mainButtonText}>
              {isRegistering ? "Register user" : "Sign in"}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ***STYLESHEET*** //
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "white",
  },
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  mainButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  mainButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchText: {
    color: "#007AFF",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
});
