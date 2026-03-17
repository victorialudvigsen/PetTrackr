import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
      style={layoutStyles.center}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.mainContainer}>
          <Text style={[textStyles.pageTitle, { fontSize: 30 }]}>
            PetTrackr
          </Text>
          <Image
            source={require("@/assets/images/paws.png")}
            style={{ width: 35, height: 35, margin: 10 }}
          />
          <Text style={[textStyles.pageTitle, { marginBottom: 16 }]}>
            {isRegistering ? "Register" : "Sign in"}
          </Text>

          {/* BRUKERNAVN */}
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={[textStyles.label, { marginBottom: 4 }]}>
                Username
              </Text>
              <TextInput
                style={inputStyles.input}
                placeholder="Username"
                value={userName}
                onChangeText={setUserName}
              />
            </View>
          )}

          {/* E-POST */}
          <View style={styles.inputContainer}>
            <Text style={[textStyles.label, { marginBottom: 4 }]}>E-mail</Text>
            <TextInput
              style={inputStyles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSORD */}
          <View style={styles.inputContainer}>
            <Text style={[textStyles.label, { marginBottom: 4 }]}>
              Password
            </Text>
            <TextInput
              style={inputStyles.input}
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
            <Text style={textStyles.switchText}>
              {isRegistering
                ? "Already have an account? Sign in"
                : "No account? Sign up here"}
            </Text>
          </Pressable>

          {/* KNAPP */}
          <Pressable
            style={buttonStyles.mainButton}
            onPress={isRegistering ? handleRegister : handleLogin}
          >
            <Text style={buttonStyles.mainButtonText}>
              {isRegistering ? "Register user" : "Sign in"}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },

  inputContainer: {
    width: "100%",
    marginBottom: 12,
  },
});
