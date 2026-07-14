package com.inversioneswilliansmarte.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String API_BASE_URL = "https://inversiones-willians-marte-api-staging.natanaelpena1202.workers.dev/api/v1";
    private static final int CONNECTION_TIMEOUT_MS = 15_000;
    private static final int READ_TIMEOUT_MS = 30_000;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences("session", MODE_PRIVATE);

        if (preferences.getString("accessToken", null) == null) {
            showLogin();
        } else {
            showHome("Cargando...");
            loadDashboard();
        }
    }

    private void showLogin() {
        LinearLayout layout = root();
        TextView title = text("Inversiones Willians Marte", 22);
        EditText username = input("Usuario");
        EditText password = input("Clave");
        password.setInputType(0x00000081);
        TextView error = text("", 14);
        Button button = button("Entrar");

        button.setOnClickListener(v -> {
            error.setText("");
            button.setEnabled(false);
            executor.execute(() -> {
                try {
                    JSONObject body = new JSONObject()
                            .put("username", username.getText().toString())
                            .put("password", password.getText().toString());
                    JSONObject data = post("/auth/login", body, null).getJSONObject("data");
                    preferences.edit()
                            .putString("accessToken", data.getString("accessToken"))
                            .putString("name", data.getJSONObject("user").getString("name"))
                            .apply();
                    main.post(() -> {
                        showHome("Cargando...");
                        loadDashboard();
                    });
                } catch (Exception e) {
                    main.post(() -> {
                        button.setEnabled(true);
                        error.setText("No se pudo iniciar sesión");
                    });
                }
            });
        });

        layout.addView(title);
        layout.addView(username);
        layout.addView(password);
        layout.addView(error);
        layout.addView(button);
        setContentView(layout);
    }

    private void showHome(String status) {
        LinearLayout layout = root();
        String name = preferences.getString("name", "Usuario");
        layout.addView(text("Bienvenido, " + name, 22));
        layout.addView(text(status, 16));

        Button refresh = button("Actualizar");
        refresh.setOnClickListener(v -> loadDashboard());
        layout.addView(refresh);

        Button clients = button("Clientes");
        clients.setOnClickListener(v -> loadClients());
        layout.addView(clients);

        Button loans = button("Préstamos");
        loans.setOnClickListener(v -> loadLoans());
        layout.addView(loans);

        Button agenda = button("Agenda");
        agenda.setOnClickListener(v -> loadAgenda());
        layout.addView(agenda);

        Button logout = button("Salir");
        logout.setOnClickListener(v -> {
            preferences.edit().clear().apply();
            showLogin();
        });
        layout.addView(logout);

        setContentView(new ScrollView(this) {{
            addView(layout);
        }});
    }

    private void loadDashboard() {
        executor.execute(() -> {
            try {
                JSONObject data = get("/reports/dashboard", token()).getJSONObject("data");
                String dashboard = "Balance activo: " + money(data.getDouble("portfolioBalance"))
                        + "\nPréstamos activos: " + data.getInt("activeLoans")
                        + "\nPréstamos atrasados: " + data.getInt("overdueLoans")
                        + "\nClientes: " + data.getInt("totalClients")
                        + "\nCobros de hoy: " + money(data.getDouble("collectionsToday"));
                main.post(() -> showHome(dashboard));
            } catch (Exception e) {
                main.post(() -> showHome("No se pudo cargar el inicio"));
            }
        });
    }

    private void loadClients() {
        showList("Clientes", "Cargando...");
        executor.execute(() -> {
            try {
                JSONArray items = get("/clients?take=50&skip=0", token()).getJSONObject("data").getJSONArray("data");
                StringBuilder text = new StringBuilder();
                for (int i = 0; i < items.length(); i++) {
                    JSONObject client = items.getJSONObject(i);
                    text.append(client.getString("firstName"))
                            .append(" ")
                            .append(client.getString("lastName"))
                            .append("\n")
                            .append(client.optString("phone", "-"))
                            .append("\n\n");
                }
                main.post(() -> showList("Clientes", text.length() == 0 ? "Sin clientes" : text.toString()));
            } catch (Exception e) {
                main.post(() -> showList("Clientes", "No se pudieron cargar los clientes"));
            }
        });
    }

    private void loadLoans() {
        showList("Préstamos", "Cargando...");
        executor.execute(() -> {
            try {
                JSONArray items = get("/loans?take=50&skip=0", token()).getJSONObject("data").getJSONArray("data");
                StringBuilder text = new StringBuilder();
                for (int i = 0; i < items.length(); i++) {
                    JSONObject loan = items.getJSONObject(i);
                    JSONObject client = loan.getJSONObject("client");
                    text.append("Préstamo #")
                            .append(loan.getInt("loanNumber"))
                            .append(" - ")
                            .append(client.getString("firstName"))
                            .append(" ")
                            .append(client.getString("lastName"))
                            .append("\nBalance: ")
                            .append(money(loan.getDouble("balance")))
                            .append("\n\n");
                }
                main.post(() -> showList("Préstamos", text.length() == 0 ? "Sin préstamos" : text.toString()));
            } catch (Exception e) {
                main.post(() -> showList("Préstamos", "No se pudieron cargar los préstamos"));
            }
        });
    }

    private void loadAgenda() {
        showList("Agenda", "Cargando...");
        executor.execute(() -> {
            try {
                JSONArray items = get("/reports/payments/upcoming", token()).getJSONArray("data");
                StringBuilder text = new StringBuilder();
                for (int i = 0; i < items.length(); i++) {
                    JSONObject payment = items.getJSONObject(i);
                    text.append(payment.getString("clientName"))
                            .append("\n")
                            .append(money(payment.getDouble("amount")))
                            .append(" - ")
                            .append(payment.getString("status"))
                            .append("\n\n");
                }
                main.post(() -> showList("Agenda", text.length() == 0 ? "Sin cobros próximos" : text.toString()));
            } catch (Exception e) {
                main.post(() -> showList("Agenda", "No se pudo cargar la agenda"));
            }
        });
    }

    private void showList(String title, String body) {
        LinearLayout layout = root();
        layout.addView(text(title, 22));
        layout.addView(text(body, 16));

        Button home = button("Inicio");
        home.setOnClickListener(v -> {
            showHome("Cargando...");
            loadDashboard();
        });
        layout.addView(home);

        setContentView(new ScrollView(this) {{
            addView(layout);
        }});
    }

    private JSONObject get(String path, String token) throws Exception {
        HttpURLConnection connection = open(path, "GET", token);
        return read(connection);
    }

    private JSONObject post(String path, JSONObject body, String token) throws Exception {
        HttpURLConnection connection = open(path, "POST", token);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(body.toString().getBytes(StandardCharsets.UTF_8));
        }
        return read(connection);
    }

    private HttpURLConnection open(String path, String method, String token) throws Exception {
        URL url = URI.create(API_BASE_URL + path).toURL();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(CONNECTION_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        if (token != null) {
            connection.setRequestProperty("Authorization", "Bearer " + token);
        }
        return connection;
    }

    private JSONObject read(HttpURLConnection connection) throws Exception {
        int code = connection.getResponseCode();
        BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? connection.getInputStream() : connection.getErrorStream(),
                StandardCharsets.UTF_8
        ));
        StringBuilder text = new StringBuilder();
        for (String line; (line = reader.readLine()) != null; ) {
            text.append(line);
        }
        if (code < 200 || code >= 300) {
            throw new IllegalStateException(text.toString());
        }
        return new JSONObject(text.toString());
    }

    private String token() {
        return preferences.getString("accessToken", "");
    }

    private String money(double value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-DO"));
        return format.format(value);
    }

    private LinearLayout root() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(40, 64, 40, 40);
        return layout;
    }

    private TextView text(String value, int size) {
        TextView text = new TextView(this);
        text.setText(value);
        text.setTextSize(size);
        text.setPadding(0, 10, 0, 10);
        return text;
    }

    private EditText input(String hint) {
        EditText input = new EditText(this);
        input.setHint(hint);
        return input;
    }

    private Button button(String label) {
        Button button = new Button(this);
        button.setText(label);
        return button;
    }
}
