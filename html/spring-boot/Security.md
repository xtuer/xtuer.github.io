使用 Spring Security 的步骤:

* 引入 Spring Security 依赖
* 定义 WebSecurityConfig
* 定义 JwtAuthenticationFilter [可选]
* 定义 LoginSuccessHandler [可选]
* 登录页 login.html
  * 默认登录成功后跳转到登录前的页面或者首页，如果指定了登录成功的处理器则由此处理器进行后续处理
  * 登录失败跳转到页面 `/login?error`
  * 注销成功后跳转到页面 `/login?logout`
* 需要角色 USER 才能访问的页面
  * 不同的 URL 设计不同的访问权限

参考文档:

* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot Security](https://www.cnblogs.com/cjsblog/p/9152455.html)
* [在 Spring Boot 中使用 Spring Security 实现权限控制](https://blog.csdn.net/u012702547/article/details/54319508)

## 引入 Spring Security 依赖

```groovy
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'org.springframework.security:spring-security-test'
```

## 定义 WebSecurityConfig

```java
package com.xtuer.config;

import com.xtuer.security.LoginSuccessHandler;
import com.xtuer.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                    .antMatchers("/", "/home").permitAll() // 不需要登录
                    .antMatchers("/hello").hasRole("USER") // 需要登录，且角色为 USER，这里不加前缀 ROLE_
                    .anyRequest().authenticated()          // 需要登录，什么角色都可以
                    .and()
                // 登录页面的 URL: /login, GET 请求
                // 登录表单的 URL: /login, POST 请求
                .formLogin()
                    .loginPage("/login")
                    .successHandler(new LoginSuccessHandler()) // [可选] 自定义表单登录成功的处理器
                    .permitAll()
                    .and()
                // 注销的 URL: /logout，POST 请求
                .logout() 
                    .permitAll()
                    .and();

        // 使用 Jwt 时可禁用 Session: 需要同时设置 STATELESS 和禁用 CSRF 才能使得 Spring Security 不创建 Session
        http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        http.csrf().disable();

        // 在登录表单的 Filter 前插入 JwtAuthenticationFilter，使用 Jwt 先尝试身份认证
        http.addFilterBefore(new JwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
    }

    // 配置 Spring Security 忽略的路径，一般为静态资源
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/static/**", "/static-p/**", "/static-m/**");
    }

    // 实际业务中返回自定义的 UserDetailsService
    @Bean
    @Override
    public UserDetailsService userDetailsService() {
        // Spring Boot Security 启动时已经使用 PasswordEncoderFactories.createDelegatingPasswordEncoder()
        // 创建了 PasswordEncoder (BCryptPasswordEncoder)，不需要我们再创建一个
        UserDetails bob = User.withDefaultPasswordEncoder()
                .username("bob") // 账号: bob
                .password("bob") // 密码: bob
                .roles("USER")   // 角色 USER
                .build();

        UserDetails admin = User
                .withUsername("admin")
                .password("{bcrypt}$2a$10$KYIBStaQwdYEetYcKlb/Uu0vENXOTxdvaAfnOrZlvsDoVUfmuXIHi") // 密码: admin
                .roles("ADMIN")
                .build();

        return new InMemoryUserDetailsManager(admin, bob);
    }
}
```

## 定义 JwtAuthenticationFilter [可选]

```java
package com.xtuer.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // 如果已经通过认证，则执行下一个 Filter (UsernamePasswordAuthenticationFilter)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. 从 header 或者 cookie 中获取 Jwt
        // 2. 如果 Jwt 有效则从中获取用户对象，保存到 authentication
        //    User user = userFromJwt(jwt);
        //    Authentication auth = new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities())
        //    SecurityContextHolder.getContext().setAuthentication(auth);
        // 3. 继续执行下一个 Filter

        filterChain.doFilter(request, response);
    }
}
```

## 定义 LoginSuccessHandler [可选]

```java
package com.xtuer.security;

import com.xtuer.bean.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class LoginSuccessHandler implements AuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        // 1. 获取用户对象，保存到 authentication
        // 2. 生成用户的 Jwt 保存到 cookie
        // 3. 重定向到用户对应的页面

        // UserDetails userDetails = (UserDetails) authentication.getPrincipal(); // UserDetailsService.loadUserByUsername() 返回的用户信息
        // User user = userService.findUserByUsername(userDetails.getUsername());
        // Authentication auth = new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities());

        response.sendRedirect("/");
    }
}
```

## 定义登录页 login.html

```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:th="https://www.thymeleaf.org"
      xmlns:sec="https://www.thymeleaf.org/thymeleaf-extras-springsecurity3">
<head>
    <title>Spring Security Example </title>
</head>
<body>
    <div th:if="${param.error}">
        Invalid username and password.
    </div>
    <div th:if="${param.logout}">
        You have been logged out.
    </div>

    <form th:action="@{/login}" method="post">
        <div><label> User Name : <input type="text" name="username"/> </label></div>
        <div><label> Password: <input type="password" name="password"/> </label></div>
        <div><input type="submit" value="Sign In"/></div>
    </form>
</body>
</html>
```

> 默认登录成功后跳转到登录前的页面或者首页，如果指定了登录成功的处理器则有次处理器进行后续处理登录失败跳转到页面 `/login?error`。

## 需要角色 USER 才能访问的页面

```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:th="https://www.thymeleaf.org"
      xmlns:sec="https://www.thymeleaf.org/thymeleaf-extras-springsecurity3">
<head>
    <title>Hello World!</title>
</head>
<body>
    <h1 th:inline="text">Hello [[${#httpServletRequest.remoteUser}]]!</h1>
    <form th:action="@{/logout}" method="post">
        <input type="submit" value="Sign Out"/>
    </form>
</body>
</html>
```

> 注销成功后跳转到页面 `/login?logout`。