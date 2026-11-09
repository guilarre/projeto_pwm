import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    router.replace('/home');
  };

  return (
    <View style={styles.externalContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Moldura idêntica à da Home */}
      <View style={styles.phoneFrame}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="bus" size={40} color="#27ae60" />
              </View>
              <ThemedText style={styles.appName}>BusRecife</ThemedText>
              <ThemedText style={styles.appSubtitle}>Monitoramento em tempo real</ThemedText>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>E-mail</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="seu.email@exemplo.com"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Senha</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="#888"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <ThemedText style={styles.loginButtonText}>Entrar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externalContainer: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  phoneFrame: { 
    width: '100%', 
    maxWidth: 420, 
    height: '100%', 
    maxHeight: 850, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 24, 
    overflow: 'hidden', 
    elevation: 10 
  },
  safeArea: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    justifyContent: 'center', 
    width: '100%', 
    alignSelf: 'center' 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40, 
    gap: 8 
  },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(39, 174, 96, 0.15)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  appName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#111' 
  },
  appSubtitle: { 
    fontSize: 14, 
    color: '#666' 
  },
  formContainer: { 
    gap: 20 
  },
  inputGroup: { 
    gap: 8 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333' 
  },
  input: { 
    height: 50, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    fontSize: 15, 
    color: '#333', 
    borderWidth: 1, 
    borderColor: '#e1e8ed' 
  },
  loginButton: { 
    height: 50, 
    backgroundColor: '#27ae60', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10, 
    shadowColor: '#27ae60', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 3 
  },
  loginButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
