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
      Alert.alert("Feil", "Fyll ut brukernavn, e-post og passord.");
      return;
    }

    try {
      await createUser(email, password, userName);

      Alert.alert("Suksess", "Bruker registrert! Du blir nå logget inn");

      // Nullstiller felter
      setUserName("");
      setPassword("");
      setEmail("");

      // Går tilbake til login
      setIsRegistering(false);
    } catch (error) {
      Alert.alert("Feil", "Registreringen feilet. Sjekk e-post og passord.");
      console.log(error);
    }
  };

  // Logger inn med Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Feil", "Fyll ut både e-post og passord.");
      return;
    }

    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert("Feil", "Innlogging feilet. Sjekk e-post og passord.");
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
            {isRegistering ? "Registrer deg" : "Logg inn"}
          </Text>

          {/* BRUKERNAVN */}
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Brukernavn</Text>
              <TextInput
                style={styles.input}
                placeholder="Brukernavn"
                value={userName}
                onChangeText={setUserName}
              />
            </View>
          )}

          {/* E-POST */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-post</Text>
            <TextInput
              style={styles.input}
              placeholder="E-post"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* PASSORD */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Passord"
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
                ? "Har du allerede en bruker? Logg inn"
                : "Ingen bruker? Registrer deg her"}
            </Text>
          </Pressable>

          {/* KNAPP */}
          <Pressable
            style={styles.mainButton}
            onPress={isRegistering ? handleRegister : handleLogin}
          >
            <Text style={styles.mainButtonText}>
              {isRegistering ? "Registrer bruker" : "Logg inn"}
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
